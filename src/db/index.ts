import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";
import * as schema from "../model";

const databaseHost = (() => {
  try {
    return new URL(env.DATABASE_URL).hostname;
  } catch {
    return "";
  }
})();

const isLocalDb = databaseHost === "localhost" || databaseHost === "127.0.0.1";
const ssl = isLocalDb ? undefined : { rejectUnauthorized: false };

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl,
  max: env.PG_POOL_MAX,
  idleTimeoutMillis: env.PG_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.PG_CONNECTION_TIMEOUT_MS,
  statement_timeout: env.PG_STATEMENT_TIMEOUT_MS,
});

export const db = drizzle(pool, { schema });
