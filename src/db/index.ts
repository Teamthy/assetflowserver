import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env";
import * as schema from "../model";

const ssl = env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl,
});

export const db = drizzle(pool, { schema });
