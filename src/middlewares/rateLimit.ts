import { NextFunction, Request, Response } from "express";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix: string;
  /**
   * Optional custom key extractor.
   * Defaults to IP-based limiting.
   * Use `scopeToUser` for user-based limiting.
   */
  keyExtractor?: (req: Request) => string;
  /**
   * If true, uses userId from req.auth instead of IP.
   * Falls back to IP if not authenticated.
   */
  scopeToUser?: boolean;
  /**
   * Custom error message for this limit.
   */
  message?: string;
}

const buckets = new Map<string, { count: number; resetAt: number }>();
let nextSweepAt = 0;

const sweepExpiredBuckets = (now: number) => {
  if (now < nextSweepAt) return;
  nextSweepAt = now + 60_000;

  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
};

export const createRateLimit = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Build the key
    let identifier: string;

    if (config.keyExtractor) {
      identifier = config.keyExtractor(req);
    } else if (config.scopeToUser && req.auth?.userId) {
      // User-scoped: prefer userId when authenticated
      identifier = `user:${req.auth.userId}`;
    } else {
      identifier = `ip:${req.ip ?? "unknown"}`;
    }

    const key = `${config.keyPrefix}:${identifier}`;
    const now = Date.now();
    sweepExpiredBuckets(now);
    const current = buckets.get(key);

    if (!current || now > current.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + config.windowMs });
      // Set rate limit headers on first request
      res.setHeader("X-RateLimit-Limit", config.max.toString());
      res.setHeader("X-RateLimit-Remaining", (config.max - 1).toString());
      res.setHeader(
        "X-RateLimit-Reset",
        Math.ceil((now + config.windowMs) / 1000).toString()
      );
      return next();
    }

    // Set headers on every response
    res.setHeader("X-RateLimit-Limit", config.max.toString());
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, config.max - current.count - 1).toString()
    );
    res.setHeader(
      "X-RateLimit-Reset",
      Math.ceil(current.resetAt / 1000).toString()
    );

    if (current.count >= config.max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      return res.status(429).json({
        success: false,
        code: "RATE_LIMIT_EXCEEDED",
        message:
          config.message ??
          "Too many requests, please try again later.",
        retryAfter,
      });
    }

    current.count += 1;
    return next();
  };
};

// ─── Preset Rate Limiters ─────────────────────────────────────────────────────
// Reusable presets for common scenarios.

/**
 * Global API rate limit — protects against DDoS
 * 300 requests per minute per IP
 */
export const globalRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyPrefix: "global",
  message: "Too many requests. Please slow down.",
});

/**
 * Heavy compute rate limit — batch operations, exports, imports
 * 20 per hour per user
 */
export const heavyComputeRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyPrefix: "heavy",
  scopeToUser: true,
  message: "Heavy operation limit reached. Please wait before retrying.",
});

/**
 * Very heavy compute — depreciation runs, bulk QR
 * 5 per hour per user
 */
export const veryHeavyRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyPrefix: "very-heavy",
  scopeToUser: true,
  message:
    "This intensive operation is rate limited. Please wait before retrying.",
});

/**
 * File upload rate limit — imports, evidence uploads
 * 10 per hour per user
 */
export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyPrefix: "upload",
  scopeToUser: true,
  message: "Too many uploads. Please wait before uploading again.",
});

/**
 * Email-triggering rate limit — invitations, notifications
 * 30 per hour per user
 */
export const emailRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyPrefix: "email",
  scopeToUser: true,
  message: "Too many email actions. Please wait before retrying.",
});

/**
 * Bulk operation rate limit
 * 20 per hour per user
 */
export const bulkRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyPrefix: "bulk",
  scopeToUser: true,
  message: "Bulk operation limit reached.",
});

/**
 * Approval action rate limit
 * 60 per hour per user
 */
export const approvalRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  keyPrefix: "approval",
  scopeToUser: true,
});