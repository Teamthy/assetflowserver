module.exports = async function globalTeardown() {
    try {
        const { pool } = await import("../../../db");
        await pool.end();
    } catch {
        // Pool may already be closed
    }
};