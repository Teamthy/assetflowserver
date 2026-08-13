import { Worker } from "bullmq";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { getRedisConnection, hasRedis } from "./queue/redis";
import { QUEUE_NAMES } from "./queue/queues";
import { processMaintenanceJob, processWarrantyJob } from "./queue/processors";

if (!hasRedis) {
  logger.error("[Worker] REDIS_URL or VALKEY_URL is required to run the worker");
  process.exit(1);
}

const connection = getRedisConnection();
if (!connection) {
  process.exit(1);
}

const warrantyWorker = new Worker(
  QUEUE_NAMES.WARRANTY,
  async () => {
    await processWarrantyJob();
  },
  { connection, concurrency: 1 },
);

const maintenanceWorker = new Worker(
  QUEUE_NAMES.MAINTENANCE,
  async () => {
    await processMaintenanceJob();
  },
  { connection, concurrency: 1 },
);

warrantyWorker.on("completed", (job) => {
  logger.info("[Worker] warranty job completed", { jobId: job.id });
});
maintenanceWorker.on("completed", (job) => {
  logger.info("[Worker] maintenance job completed", { jobId: job.id });
});
warrantyWorker.on("failed", (job, error) => {
  logger.error("[Worker] warranty job failed", {
    jobId: job?.id,
    error: error.message,
  });
});
maintenanceWorker.on("failed", (job, error) => {
  logger.error("[Worker] maintenance job failed", {
    jobId: job?.id,
    error: error.message,
  });
});

logger.info("[Worker] BullMQ workers started", {
  env: env.NODE_ENV,
  queues: [QUEUE_NAMES.WARRANTY, QUEUE_NAMES.MAINTENANCE],
});

const shutdown = async () => {
  await Promise.all([warrantyWorker.close(), maintenanceWorker.close()]);
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
