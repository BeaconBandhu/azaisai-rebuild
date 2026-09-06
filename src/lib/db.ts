import postgres from "postgres";

// Singleton Postgres client (server-only). Uses the pooled connection since
// this serves normal app queries, not migrations (see scripts/migrate.mjs
// for the direct/non-pooled connection used for DDL).
declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const connStr = process.env.POSTGRES_URL;
  if (!connStr) throw new Error("POSTGRES_URL is not set");
  return postgres(connStr, { ssl: "require" });
}

export const sql = globalThis.__sql ?? createClient();
if (process.env.NODE_ENV !== "production") globalThis.__sql = sql;
