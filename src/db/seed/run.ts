import { pool } from "../index";
import { logger } from "../../utils/logger";
import { seedPermissions } from "./permissions.seed";

/**
 * Runnable seed entry point.
 *
 * Usage:
 *   pnpm db:seed
 *
 * Add more seed functions here as the system grows (e.g., default plans).
 */
const run = async () => {
    try {
        logger.info("Starting seed run...");
        await seedPermissions();
        logger.info("Seed run complete");
    } catch (error) {
        logger.error("Seed run failed", { error });
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
};

run();