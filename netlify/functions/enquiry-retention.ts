import {
  applyRetention,
  closeDatabase,
  getDatabase,
} from "../../src/lib/server/database";

export default async function enquiryRetention() {
  // This job applies only to legacy PostgreSQL data, not the Netlify Forms inbox.
  if (!process.env.DATABASE_URL) return;

  try {
    await applyRetention(
      await getDatabase(),
      Number(process.env.ENQUIRY_RETENTION_DAYS || 180),
    );
    console.info("enquiry_retention_complete");
  } finally {
    await closeDatabase();
  }
}
