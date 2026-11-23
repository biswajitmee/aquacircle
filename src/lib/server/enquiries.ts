import { createHash, randomUUID } from "node:crypto";
import type { EnquiryInput } from "@/lib/validation";
import type { Database } from "./database";
import { sendBusinessEmail, sendAcknowledgement } from "./email";
export type EnquiryRecord = Record<string, unknown> & {
  id: string;
  reference: string;
  payload: EnquiryInput;
  payload_hash: string;
  status: string;
  attempts: number;
  created_at: Date;
};
export const payloadHash = (data: EnquiryInput) =>
  createHash("sha256").update(JSON.stringify(data)).digest("hex");
export class DuplicateConflict extends Error {}
export async function saveEnquiry(
  db: Database,
  data: EnquiryInput,
  idempotencyKey: string,
) {
  const id = randomUUID();
  const reference = `AC-${new Date().getUTCFullYear()}-${id.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const hash = payloadHash(data);
  const insert = await db.query<EnquiryRecord>(
    `INSERT INTO enquiries(id,reference,idempotency_key,payload_hash,payload,status) VALUES($1,$2,$3,$4,$5::jsonb,'EMAIL_PENDING') ON CONFLICT(idempotency_key) DO NOTHING RETURNING *`,
    [
      id,
      reference,
      idempotencyKey,
      hash,
      JSON.stringify({ ...data, website: undefined }),
    ],
  );
  if (insert.rows.length) return { record: insert.rows[0], duplicate: false };
  const existing = await db.query<EnquiryRecord>(
    "SELECT * FROM enquiries WHERE idempotency_key=$1",
    [idempotencyKey],
  );
  if (existing.rows[0].payload_hash !== hash) throw new DuplicateConflict();
  return { record: existing.rows[0], duplicate: true };
}
export type Delivery = (
  reference: string,
  data: EnquiryInput,
  createdAt: Date,
) => Promise<void>;
export async function deliverEnquiry(
  db: Database,
  id?: string,
  send: Delivery = sendBusinessEmail,
) {
  // One atomic claim, shared across web instances and workers. A crashed claim expires.
  const claim = await db.query<EnquiryRecord>(
    `UPDATE enquiries SET lease_until=now()+interval '2 minutes',attempts=attempts+1,updated_at=now() WHERE id=(SELECT id FROM enquiries WHERE status IN ('EMAIL_PENDING','EMAIL_FAILED') AND attempts<10 AND next_attempt_at<=now() AND (lease_until IS NULL OR lease_until<now()) ${id ? "AND id=$1" : ""} ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`,
    id ? [id] : [],
  );
  const record = claim.rows[0];
  if (!record) return { claimed: false, sent: false };
  try {
    await send(record.reference, record.payload, new Date(record.created_at));
    await db.query(
      `UPDATE enquiries SET status='EMAIL_SENT',lease_until=NULL,last_error=NULL,updated_at=now() WHERE id=$1`,
      [record.id],
    );
  } catch {
    // Never persist provider error text: it can contain recipient addresses or credentials.
    const retry = Math.min(3600, 30 * 2 ** Math.min(record.attempts, 7));
    await db.query(
      `UPDATE enquiries SET status='EMAIL_FAILED',lease_until=NULL,last_error='DELIVERY_FAILED',next_attempt_at=now()+($2*interval '1 second'),updated_at=now() WHERE id=$1`,
      [record.id, retry],
    );
    return { claimed: true, sent: false };
  }
  try {
    if (await sendAcknowledgement(record.reference, record.payload))
      await db.query(
        "UPDATE enquiries SET acknowledgement_sent_at=now() WHERE id=$1",
        [record.id],
      );
  } catch {
    console.error("customer_acknowledgement_failed", record.reference);
  }
  return { claimed: true, sent: true };
}
