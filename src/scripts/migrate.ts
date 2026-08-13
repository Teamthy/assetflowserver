import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../db";
import { logger } from "../utils/logger";

const run = async () => {
  logger.info("Applying Drizzle migrations");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  logger.info("Migrations applied");
};

run()
  .catch((error) => {
    logger.error("Migration failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
