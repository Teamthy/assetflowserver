import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error";
import { globalRateLimit } from "./middlewares/rateLimit";
import { apiRouter } from "./routes";
import { requestLogger } from "./utils/logger";
const allowOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true;
  if (env.CORS_ORIGIN.includes(origin)) return true;
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return true;
  if (/^https:\/\/[\w.-]+\.vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/[\w.-]+\.e2b\.app$/.test(origin)) return true;
  return false;
};
const corsOptions: CorsOptions = {
  origin: (origin, callback) => { callback(null, allowOrigin(origin)); },
  credentials: true,
};
export const createApp = () => {
  const app = express();
  app.set("trust proxy", env.TRUST_PROXY);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, crossOriginEmbedderPolicy: false }));
  app.use(cors(corsOptions));
  app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
  app.use(requestLogger);
  app.get("/health", (_req, res) => { res.status(200).json({ status: "ok" }); });
  app.use("/api", (req, res, next) => {
    if (req.path === "/health") return next();
    return globalRateLimit(req, res, next);
  }, apiRouter);
  app.use(errorHandler);
  return app;
};
export const app = createApp();