import dotenv from "dotenv";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sanitizeDatabaseUrl } from "../config/database-url";

dotenv.config();

/**
 * Migrations only need DATABASE_URL.
 * Do not import src/config/env.ts — that schema requires FRONTEND_URL / Resend
 * and will fail the Render build when those are blank or a CORS list.
 */

const formatError = (error: unknown) => {
  if (!(error instanceof Error)) return String(error);
  const pg = error as Error & { code?: string; detail?: string; hint?: string };
  return [pg.message, pg.code && `code=${pg.code}`, pg.detail, pg.hint]
    .filter(Boolean)
    .join(" | ");
};

const run = async () => {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "DATABASE_URL is required to migrate. Set it in the Render Environment tab.",
    );
  }

  const connectionString = sanitizeDatabaseUrl(raw);
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
    statement_timeout: 60_000,
  });

  try {
    console.log("Connecting to Postgres...");
    await pool.query("select 1 as ok");
    console.log("Connected. Applying migrations...");
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("Migrations applied");
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  console.error("Migration failed:", formatError(error));
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
