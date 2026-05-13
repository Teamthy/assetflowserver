import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./src/config/env";
import { logger, requestLogger } from "./src/utils/logger";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(env.PORT, () => {
  logger.info(`API running on port ${env.PORT}`);
});
