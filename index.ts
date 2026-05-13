import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./src/config/env";
import { errorHandler } from "./src/middlewares/error";
import { apiRouter } from "./src/routes";
import { logger, requestLogger } from "./src/utils/logger";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(requestLogger);

app.use("/api", apiRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`API running on port ${env.PORT}`);
});
