import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";

const formatError = (error: unknown) => {
  if (!(error instanceof Error)) return String(error);
  const pg = error as Error & { code?: string; detail?: string; hint?: string };
  return [pg.message, pg.code && `code=${pg.code}`, pg.detail, pg.hint]
    .filter(Boolean)
    .join(" | ");
};

const run = async () => {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
    statement_timeout: 60_000,
  });

  try {
    const ping = await pool.query(
      "select current_database() as db, current_user as usr, current_schema() as schema",
    );
    console.log("connected", ping.rows[0]);

    const tables = await pool.query(
      "select tablename from pg_tables where schemaname = 'public' order by 1",
    );
    console.log(
      "public tables:",
      tables.rows.map((row) => row.tablename).join(", ") || "(none)",
    );

    try {
      const journal = await pool.query(
        "select id, hash, created_at from drizzle.__drizzle_migrations order by created_at",
      );
      console.log("drizzle journal rows:", journal.rows.length);
      for (const row of journal.rows) {
        console.log("  ", row.id, row.hash, row.created_at);
      }
    } catch (error) {
      console.log("drizzle journal:", formatError(error));
    }

    console.log("applying migrations...");
    await migrate(drizzle(pool), { migrationsFolder: "./src/db/migrations" });
    console.log("migrations applied");
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  console.error("FAIL:", formatError(error));
  if (error instanceof Error && error.stack) console.error(error.stack);
  process.exit(1);
});
