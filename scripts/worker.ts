import {
  getDatabase,
  closeDatabase,
  applyRetention,
} from "../src/lib/server/database";
import { deliverEnquiry } from "../src/lib/server/enquiries";
if (!process.env.DATABASE_URL)
  throw new Error(
    "Worker requires PostgreSQL. Local PGlite is owned by the web process; its after hook delivers development mail.",
  );
let running = true;
process.on("SIGINT", () => {
  running = false;
});
process.on("SIGTERM", () => {
  running = false;
});
const db = await getDatabase();
let lastRetention = 0;
while (running) {
  try {
    for (let i = 0; i < 20; i++) {
      const result = await deliverEnquiry(db);
      if (!result.claimed) break;
    }
    if (Date.now() - lastRetention > 86400000) {
      await applyRetention(
        db,
        Number(process.env.ENQUIRY_RETENTION_DAYS || 180),
      );
      lastRetention = Date.now();
    }
  } catch {
    console.error("delivery_worker_cycle_failed");
  }
  await new Promise((r) => setTimeout(r, 30000));
}
await closeDatabase();
