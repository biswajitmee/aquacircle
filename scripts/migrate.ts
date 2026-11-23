import { getDatabase, closeDatabase } from "../src/lib/server/database";
await getDatabase();
console.log("Database schema is ready.");
await closeDatabase();
