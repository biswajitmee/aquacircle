import { getDatabase, closeDatabase } from "../src/lib/server/database";
const days = Number(process.env.ENQUIRY_RETENTION_DAYS || 180);
if (!Number.isInteger(days) || days < 30)
  throw new Error("Retention must be at least 30 days.");
const db = await getDatabase();
const result = await db.query(
  `DELETE FROM enquiries WHERE status IN ('EMAIL_SENT','CONTACTED','CLOSED') AND created_at<now()-($1*interval '1 day') RETURNING id`,
  [days],
);
await db.query("DELETE FROM rate_limits WHERE expires_at<now()");
console.log(
  `Removed ${result.rows.length} expired handled enquiries. Unresolved deliveries were retained for recovery.`,
);
await closeDatabase();
