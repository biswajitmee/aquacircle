import { closeDatabase, getDatabase } from "../../src/lib/server/database";
import { mailConfigurationReady } from "../../src/lib/server/email";
import { deliverEnquiry } from "../../src/lib/server/enquiries";

export default async function retryEnquiries() {
  if (!process.env.DATABASE_URL || !mailConfigurationReady()) {
    throw new Error("Configure PostgreSQL and SMTP in Netlify before retrying enquiries.");
  }

  try {
    const db = await getDatabase();
    // One claim per invocation keeps work bounded for the 30-second schedule limit.
    // The normal request also attempts delivery; expired leases recover interruptions.
    const result = await deliverEnquiry(db);
    console.info("enquiry_retry", { claimed: result.claimed, sent: result.sent });
  } finally {
    await closeDatabase();
  }
}
