import IORedis from "ioredis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const redisUrl = env.VALKEY_URL || env.REDIS_URL;

export const hasRedis = Boolean(redisUrl);

let connection: IORedis | null = null;

export const getRedisConnection = (): IORedis | null => {
  if (!redisUrl) return null;
  if (connection) return connection;

  connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  connection.on("error", (error) => {
    logger.error("[Redis] connection error", {
      error: error instanceof Error ? error.message : String(error),
    });
  });

  return connection;
};
