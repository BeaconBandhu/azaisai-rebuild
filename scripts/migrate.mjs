#!/usr/bin/env node
// Applies every .sql file in supabase/migrations/ (in filename order) against
// POSTGRES_URL_NON_POOLING — a direct (non-pgbouncer) connection, needed for
// DDL statements like CREATE EXTENSION/TABLE. Run: node scripts/migrate.mjs
import postgres from "postgres";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const connStr = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connStr) {
  console.error("POSTGRES_URL_NON_POOLING (or POSTGRES_URL) is not set. Run `vercel env pull` first.");
  process.exit(1);
}

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const sql = postgres(connStr, { ssl: "require" });

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  const contents = readFileSync(filePath, "utf8");
  console.log(`Applying ${file}...`);
  await sql.unsafe(contents);
  console.log(`  done.`);
}

await sql.end();
console.log("All migrations applied.");
