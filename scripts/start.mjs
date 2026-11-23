import path from "node:path";
// Resolve before Next's standalone bootstrap changes its working directory.
if (process.env.LOCAL_DEVELOPMENT === "1") {
  process.env.LOCAL_DATABASE_PATH = path.resolve(
    process.env.LOCAL_DATABASE_PATH || ".data/aquacircle",
  );
  process.env.HOSTNAME = process.env.HOSTNAME || "127.0.0.1";
}
await import("../.next/standalone/server.js");
