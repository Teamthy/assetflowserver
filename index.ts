import { initSentry } from "./src/config/sentry";
initSentry();

import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./src/config/env";
import { errorHandler } from "./src/middlewares/error";
import { globalRateLimit } from "./src/middlewares/rateLimit";
import { apiRouter } from "./src/routes";
import { logger, requestLogger } from "./src/utils/logger";
import { seedAllOrganizations } from "./src/db/seeds/roles.seeder";
import { startScheduler } from "./src/jobs";

const app = express();

app.set("trust proxy", env.TRUST_PROXY);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
app.use(requestLogger);

// Apply global rate limit BEFORE routes
app.use("/api", globalRateLimit, apiRouter);

app.use(errorHandler);

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