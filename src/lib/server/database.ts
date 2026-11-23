import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
export interface Database {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
  close(): Promise<void>;
}
const schema = `
CREATE TABLE IF NOT EXISTS enquiries (
 id UUID PRIMARY KEY,
 reference TEXT NOT NULL UNIQUE,
 idempotency_key UUID NOT NULL UNIQUE,
 payload_hash TEXT NOT NULL,
 payload JSONB NOT NULL,
 status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED','EMAIL_PENDING','EMAIL_SENT','EMAIL_FAILED','CONTACTED','CLOSED')),
 attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 lease_until TIMESTAMPTZ,
 last_error TEXT,
 acknowledgement_sent_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS enquiry_retry_idx ON enquiries(status,next_attempt_at);
CREATE INDEX IF NOT EXISTS enquiry_created_idx ON enquiries(created_at);
CREATE TABLE IF NOT EXISTS rate_limits (
 key TEXT PRIMARY KEY,
 count INTEGER NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limit_expiry_idx ON rate_limits(expires_at);
`;
const globalDb = globalThis as typeof globalThis & {
  aquaDb?: Promise<Database>;
};
export function createDatabase(
  url?: string,
  localPath?: string,
): Promise<Database> {
  return (async () => {
    let db: Database;
    if (url) {
      const pool = new Pool({
        connectionString: url,
        max: 8,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      });
      pool.on("error", () => console.error("database_pool_error"));
      db = {
        query: async <T extends Record<string, unknown>>(
          sql: string,
          params?: unknown[],
        ) => pool.query<T>(sql, params),
        close: () => pool.end(),
      };
    } else {
      const location =
        localPath === ":memory:"
          ? undefined
          : path.resolve(localPath || ".data/aquacircle");
      if (location) await mkdir(location, { recursive: true });
      const embedded = new PGlite(location);
      await embedded.waitReady;
      db = {
        query: async <T extends Record<string, unknown>>(
          sql: string,
          params?: unknown[],
        ) => embedded.query<T>(sql, params),
        close: () => embedded.close(),
      };
      await embedded.exec(schema);
      return db;
    }
    await db.query(schema);
    return db;
  })();
}
export function getDatabase(): Promise<Database> {
  if (!process.env.DATABASE_URL && process.env.LOCAL_DEVELOPMENT !== "1")
    throw new Error("Database is not configured");
  globalDb.aquaDb ??= createDatabase(
    process.env.DATABASE_URL,
    process.env.LOCAL_DATABASE_PATH,
  ).catch((error) => {
    globalDb.aquaDb = undefined;
    throw error;
  });
  return globalDb.aquaDb;
}
export async function closeDatabase() {
  if (globalDb.aquaDb) await (await globalDb.aquaDb).close();
  globalDb.aquaDb = undefined;
}
export async function applyRetention(db: Database, days = 180) {
  if (!Number.isInteger(days) || days < 30)
    throw new Error("Retention must be at least 30 days.");
  await db.query(
    `DELETE FROM enquiries WHERE status IN ('EMAIL_SENT','CONTACTED','CLOSED') AND created_at<now()-($1*interval '1 day')`,
    [days],
  );
  await db.query("DELETE FROM rate_limits WHERE expires_at<now()");
}
export async function consumeLimit(
  db: Database,
  key: string,
  limit: number,
  seconds: number,
): Promise<boolean> {
  const result = await db.query<{ count: number }>(
    `INSERT INTO rate_limits(key,count,expires_at) VALUES($1,1,now()+($2*interval '1 second')) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<=now() THEN 1 ELSE rate_limits.count+1 END, expires_at=CASE WHEN rate_limits.expires_at<=now() THEN now()+($2*interval '1 second') ELSE rate_limits.expires_at END RETURNING count`,
    [key, seconds],
  );
  return result.rows[0].count <= limit;
}
