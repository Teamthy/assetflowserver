import cron from "node-cron";
import { SCHEDULER_CONFIG } from "../config/scheduler";
import { runWarrantyExpiryJob } from "./warranty.job";
import { runMaintenanceDueJob } from "./maintenance.job";
import { logger } from "../utils/logger";

/**
 * Start all scheduled jobs.
 * Called once on server startup.
 */
export function startScheduler(): void {
    logger.info("[Scheduler] Starting scheduled jobs...");

    // ─── Warranty Expiry Job ───────────────────────────────────────
    if (SCHEDULER_CONFIG.WARRANTY_CHECK.enabled) {
        cron.schedule(
            SCHEDULER_CONFIG.WARRANTY_CHECK.cronExpression,
            async () => {
                logger.info("[Scheduler] Running warranty expiry job...");
                try {
                    await runWarrantyExpiryJob();
                } catch (error) {
                    logger.error("[Scheduler] Warranty expiry job failed", {
                        error:
                            error instanceof Error ? error.message : String(error),
                    });
                }
            },
            {
                timezone: "UTC",
            }
        );

        logger.info(
            `[Scheduler] Warranty expiry job scheduled: ${SCHEDULER_CONFIG.WARRANTY_CHECK.cronExpression}`
        );
    }

    // ─── Maintenance Due Soon Job ──────────────────────────────────
    if (SCHEDULER_CONFIG.MAINTENANCE_DUE.enabled) {
        cron.schedule(
            SCHEDULER_CONFIG.MAINTENANCE_DUE.cronExpression,
            async () => {
                logger.info("[Scheduler] Running maintenance due soon job...");
                try {
                    await runMaintenanceDueJob();
                } catch (error) {
                    logger.error("[Scheduler] Maintenance due job failed", {
                        error:
                            error instanceof Error ? error.message : String(error),
                    });
                }
            },
            {
                timezone: "UTC",
            }
        );

        logger.info(
            `[Scheduler] Maintenance due job scheduled: ${SCHEDULER_CONFIG.MAINTENANCE_DUE.cronExpression}`
        );
    }

    logger.info("[Scheduler] All scheduled jobs started");
}