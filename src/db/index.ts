import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";
import * as schema from "../model";

const ssl =
  env.NODE_ENV === "production"
    ? {
        rejectUnauthorized: true,
        ...(env.PG_SSL_CA_CERT ? { ca: env.PG_SSL_CA_CERT } : {}),
      }
    : undefined;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  max: env.PG_POOL_MAX,
  idleTimeoutMillis: env.PG_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.PG_CONNECTION_TIMEOUT_MS,
  statement_timeout: env.PG_STATEMENT_TIMEOUT_MS,
});

export const db = drizzle(pool, { schema });
