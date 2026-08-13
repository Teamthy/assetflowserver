import { initSentry } from "./src/config/sentry";
initSentry();

import { env } from "./src/config/env";
import { app } from "./src/app";
import { logger } from "./src/utils/logger";
import { seedAllOrganizations } from "./src/db/seeds/roles.seeder";
import { startScheduler } from "./src/jobs";

app.listen(env.PORT, async () => {
  logger.info(`API running on port ${env.PORT}`);

  try {
    await seedAllOrganizations();
    logger.info("[Startup] Role seeding completed successfully");
  } catch (error) {
    logger.error("[Startup] Role seeding failed", { error });
  }

  try {
    startScheduler();
    logger.info("[Startup] Scheduler started successfully");
  } catch (error) {
    logger.error("[Startup] Scheduler failed to start", { error });
  }
});
