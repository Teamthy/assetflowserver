// ─────────────────────────────────────────────────────────────────────────────
// TEST DATABASE HELPER
// Wraps each test in a transaction that rolls back after the test
// Ensures tests are isolated and never pollute each other
// ─────────────────────────────────────────────────────────────────────────────

import { pool } from "../../../db";
import { PoolClient } from "pg";

let client: PoolClient | null = null;

export async function beginTestTransaction(): Promise<void> {
    client = await pool.connect();
    await client.query("BEGIN");
}

export async function rollbackTestTransaction(): Promise<void> {
    if (client) {
        await client.query("ROLLBACK");
        client.release();
        client = null;
    }
}

export async function closeTestPool(): Promise<void> {
    await pool.end();
}