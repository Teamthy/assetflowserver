import morgan from "morgan";
import winston from "winston";
import { env } from "../config/env";

const sensitiveKeys = new Set([
  "password",
  "token",
  "authorization",
  "accesstoken",
  "refreshtoken",
  "secret",
  "apikey",
]);

const redactValue = (value: unknown): unknown => {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(input)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      output[key] = "[REDACTED]";
    } else {
      output[key] = redactValue(item);
    }
  }

  return output;
};

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = (): "debug" | "info" => {
  const isDevelopment = env.NODE_ENV === "development";
  return isDevelopment ? "debug" : "info";
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const log: {
      level: string;
      msg: unknown;
      time: unknown;
      stack?: string;
      meta?: Record<string, unknown>;
    } = {
      level: info.level,
      msg: info.message,
      time: info.timestamp,
    };

    if (info.stack && typeof info.stack === "string") {
      log.stack = info.stack;
    }

    const metaEntries = Object.entries(info).filter(
      ([key]) => !["level", "message", "timestamp", "stack"].includes(key),
    );

    if (metaEntries.length > 0) {
      log.meta = redactValue(Object.fromEntries(metaEntries)) as Record<
        string,
        unknown
      >;
    }

    return JSON.stringify(log);
  }),
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
  ...(env.NODE_ENV === "production"
    ? [
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
          format: jsonFormat,
          maxsize: 10 * 1024 * 1024,
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
          format: jsonFormat,
          maxsize: 10 * 1024 * 1024,
          maxFiles: 5,
        }),
      ]
    : []),
];

export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export const requestLogger = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  {
    stream,
    skip: (req) => req.url === "/api/health",
  },
);

export const safeStringify = (obj: unknown): string => {
  try {
    return JSON.stringify(redactValue(obj));
  } catch {
    if (!obj || typeof obj !== "object") return String(obj);
    return `[Circular or complex object]: ${Object.keys(obj as Record<string, unknown>).join(", ")}`;
  }
};
