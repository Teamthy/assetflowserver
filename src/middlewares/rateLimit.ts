import { NextFunction, Request, Response } from "express";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export const createRateLimit = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${config.keyPrefix}:${req.ip ?? "unknown"}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || now > current.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + config.windowMs });
      return next();
    }

    if (current.count >= config.max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      return res.status(429).json({
        success: false,
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later.",
      });
    }

    current.count += 1;
    return next();
  };
};
