import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { randomUUID } from "node:crypto";
import {
  createDatabase,
  consumeLimit,
  applyRetention,
  type Database,
} from "@/lib/server/database";
import {
  saveEnquiry,
  deliverEnquiry,
  DuplicateConflict,
} from "@/lib/server/enquiries";
import { emailContent, escapeHtml } from "@/lib/server/email";
import type { EnquiryInput } from "@/lib/validation";
let db: Database;
const payload: EnquiryInput = {
  name: "QA Customer",
  mobile: "9876543210",
  pin: "700001",
  service: "routine",
  consent: true,
  source: "service-card",
  problem: '<img src=x onerror="alert(1)"> & test',
};
beforeAll(async () => {
  db = await createDatabase(process.env.TEST_DATABASE_URL, ":memory:");
});
afterAll(async () => {
  await db.close();
});
describe("Durable enquiries and delivery", () => {
  it("persists enquiry before SMTP and returns a real reference", async () => {
    const { record } = await saveEnquiry(db, payload, randomUUID());
    expect(record.reference).toMatch(/^AC-\d{4}-[A-F0-9]{12}$/);
    expect(record.status).toBe("EMAIL_PENDING");
    const result = await db.query("SELECT payload FROM enquiries WHERE id=$1", [
      record.id,
    ]);
    expect(result.rows[0].payload).toMatchObject({ name: payload.name });
  });
  it("uses idempotency to prevent duplicate enquiries", async () => {
    const key = randomUUID();
    const one = await saveEnquiry(db, payload, key);
    const two = await saveEnquiry(db, payload, key);
    expect(two.duplicate).toBe(true);
    expect(two.record.reference).toBe(one.record.reference);
  });
  it("rejects reuse of an idempotency key with different details", async () => {
    const key = randomUUID();
    await saveEnquiry(db, payload, key);
    await expect(
      saveEnquiry(db, { ...payload, name: "Someone else" }, key),
    ).rejects.toBeInstanceOf(DuplicateConflict);
  });
  it("retains failed emails and recovers through a later retry", async () => {
    const { record } = await saveEnquiry(db, payload, randomUUID());
    const failed = await deliverEnquiry(db, record.id, async () => {
      throw new Error("SMTP rejected secret customer data");
    });
    expect(failed.sent).toBe(false);
    let row = (
      await db.query("SELECT * FROM enquiries WHERE id=$1", [record.id])
    ).rows[0];
    expect(row.status).toBe("EMAIL_FAILED");
    expect(row.last_error).toBe("DELIVERY_FAILED");
    expect(row.payload).toMatchObject({ name: payload.name });
    await db.query("UPDATE enquiries SET next_attempt_at=now() WHERE id=$1", [
      record.id,
    ]);
    const sent = await deliverEnquiry(db, record.id, async () => {});
    expect(sent.sent).toBe(true);
    row = (await db.query("SELECT * FROM enquiries WHERE id=$1", [record.id]))
      .rows[0];
    expect(row.status).toBe("EMAIL_SENT");
    expect(row.attempts).toBe(2);
  });
  it("does not send an already delivered enquiry again", async () => {
    const { record } = await saveEnquiry(db, payload, randomUUID());
    const send = vi.fn(async () => {});
    await deliverEnquiry(db, record.id, send);
    await deliverEnquiry(db, record.id, send);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("honours delivery leases and recovers expired claims", async () => {
    const { record } = await saveEnquiry(db, payload, randomUUID());
    await db.query(
      "UPDATE enquiries SET lease_until=now()+interval '1 minute' WHERE id=$1",
      [record.id],
    );
    expect((await deliverEnquiry(db, record.id, async () => {})).claimed).toBe(
      false,
    );
    await db.query(
      "UPDATE enquiries SET lease_until=now()-interval '1 minute' WHERE id=$1",
      [record.id],
    );
    expect((await deliverEnquiry(db, record.id, async () => {})).sent).toBe(
      true,
    );
  });
  it("enforces a durable rate limit atomically", async () => {
    const key = randomUUID();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => consumeLimit(db, key, 3, 60)),
    );
    expect(results.filter(Boolean)).toHaveLength(3);
  });
  it("resets an expired rate window", async () => {
    const key = randomUUID();
    await consumeLimit(db, key, 1, 60);
    expect(await consumeLimit(db, key, 1, 60)).toBe(false);
    await db.query(
      "UPDATE rate_limits SET expires_at=now()-interval '1 second' WHERE key=$1",
      [key],
    );
    expect(await consumeLimit(db, key, 1, 60)).toBe(true);
  });
  it("retention removes expired handled data and preserves unresolved deliveries", async () => {
    const handled = await saveEnquiry(db, payload, randomUUID());
    const failed = await saveEnquiry(db, payload, randomUUID());
    await db.query(
      "UPDATE enquiries SET status='CLOSED',created_at=now()-interval '200 days' WHERE id=$1",
      [handled.record.id],
    );
    await db.query(
      "UPDATE enquiries SET status='EMAIL_FAILED',created_at=now()-interval '200 days' WHERE id=$1",
      [failed.record.id],
    );
    await applyRetention(db, 180);
    expect(
      (
        await db.query("SELECT id FROM enquiries WHERE id=$1", [
          handled.record.id,
        ])
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query("SELECT id FROM enquiries WHERE id=$1", [
          failed.record.id,
        ])
      ).rows,
    ).toHaveLength(1);
  });
  it("concurrent workers cannot claim the same enquiry", async () => {
    const { record } = await saveEnquiry(db, payload, randomUUID());
    const send = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    const results = await Promise.all([
      deliverEnquiry(db, record.id, send),
      deliverEnquiry(db, record.id, send),
    ]);
    expect(results.filter((result) => result.sent)).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
describe("Email safety", () => {
  it("escapes customer input in HTML while retaining a plain text alternative", () => {
    const email = emailContent(
      "AC-TEST",
      payload,
      new Date("2026-11-23T00:00:00Z"),
    );
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;img");
    expect(email.text).toContain(payload.problem);
    expect(email.text).toContain("PIN code: 700001");
    expect(email.text).toContain("Source: service-card");
    expect(email.subject).toContain("Routine service");
  });
  it("escapes every HTML delimiter", () =>
    expect(escapeHtml("<>&\"'")).toBe("&lt;&gt;&amp;&quot;&#39;"));
});
