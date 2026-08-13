import { Queue } from "bullmq";
import { getRedisConnection, hasRedis } from "./redis";

export const QUEUE_NAMES = {
  WARRANTY: "assetflow-warranty",
  MAINTENANCE: "assetflow-maintenance",
} as const;

const connection = getRedisConnection();

export const warrantyQueue = hasRedis && connection
  ? new Queue(QUEUE_NAMES.WARRANTY, { connection })
  : null;

export const maintenanceQueue = hasRedis && connection
  ? new Queue(QUEUE_NAMES.MAINTENANCE, { connection })
  : null;
