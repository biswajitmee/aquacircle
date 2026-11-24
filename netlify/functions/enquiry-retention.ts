import {
  applyRetention,
  closeDatabase,
  getDatabase,
} from "../../src/lib/server/database";

export default async function enquiryRetention() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Configure PostgreSQL in Netlify before running retention.");
  }

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
