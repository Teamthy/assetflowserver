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
