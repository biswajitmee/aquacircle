import { getDatabase, closeDatabase } from "../src/lib/server/database";
const db = await getDatabase();
const reference = process.argv[2];
if (reference) {
  if (!/^AC-\d{4}-[A-F0-9]{12}$/.test(reference))
    throw new Error("Pass an exact enquiry reference to retry.");
  const result = await db.query(
    "UPDATE enquiries SET status='EMAIL_PENDING',attempts=0,next_attempt_at=now(),lease_until=NULL WHERE reference=$1 AND status='EMAIL_FAILED' RETURNING reference",
    [reference],
  );
  console.log({ resetForRetry: result.rows });
} else {
  const statuses = await db.query(
    "SELECT status,count(*)::integer AS count FROM enquiries GROUP BY status",
  );
  const failures = await db.query(
    "SELECT reference,attempts,created_at,next_attempt_at FROM enquiries WHERE status IN ('EMAIL_FAILED','EMAIL_PENDING') ORDER BY created_at LIMIT 100",
  );
  console.log(
    JSON.stringify(
      { statuses: statuses.rows, awaitingDelivery: failures.rows },
      null,
      2,
    ),
  );
}
await closeDatabase();
