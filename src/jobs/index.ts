import cron from "node-cron";
import { SCHEDULER_CONFIG } from "../config/scheduler";
import { runWarrantyExpiryJob } from "./warranty.job";
import { runMaintenanceDueJob } from "./maintenance.job";
import { logger } from "../utils/logger";
import { hasRedis } from "../queue/redis";
import { maintenanceQueue, warrantyQueue } from "../queue/queues";

const enqueueOrRun = async (
  name: string,
  queue: typeof warrantyQueue,
  run: () => Promise<void>,
) => {
  if (queue) {
    await queue.add(name, {}, { removeOnComplete: 50, removeOnFail: 50 });
    logger.info(`[Scheduler] Enqueued ${name} for the worker`);
    return;
  }
  await run();
};

export function startScheduler(): void {
  logger.info("[Scheduler] Starting scheduled jobs...", {
    mode: hasRedis ? "bullmq" : "inline",
  });

  if (SCHEDULER_CONFIG.WARRANTY_CHECK.enabled) {
    cron.schedule(
      SCHEDULER_CONFIG.WARRANTY_CHECK.cronExpression,
      async () => {
        try {
          await enqueueOrRun(
            SCHEDULER_CONFIG.WARRANTY_CHECK.jobName,
            warrantyQueue,
            runWarrantyExpiryJob,
          );
        } catch (error) {
          logger.error("[Scheduler] Warranty expiry job failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
      { timezone: "UTC" },
    );
  }

  if (SCHEDULER_CONFIG.MAINTENANCE_DUE.enabled) {
    cron.schedule(
      SCHEDULER_CONFIG.MAINTENANCE_DUE.cronExpression,
      async () => {
        try {
          await enqueueOrRun(
            SCHEDULER_CONFIG.MAINTENANCE_DUE.jobName,
            maintenanceQueue,
            runMaintenanceDueJob,
          );
        } catch (error) {
          logger.error("[Scheduler] Maintenance due job failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
      { timezone: "UTC" },
    );
  }

  logger.info("[Scheduler] Scheduled jobs started");
}
