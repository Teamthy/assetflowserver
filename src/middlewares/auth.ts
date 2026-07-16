import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthenticationError } from "../utils/error";
import { setSentryUser } from "../config/sentry";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  // Check Authorization header first (standard for all endpoints)
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // For SSE endpoint — also accept token as query param
  // Native EventSource API does not support custom headers
  if (!token && req.query && typeof req.query.token === "string") {
    token = req.query.token;
  }

  if (!token) {
    return next(new AuthenticationError("Missing bearer token"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & {
      userId: string;
      organizationId: string;
      email?: string;
    };

    if (!payload.userId || !payload.organizationId) {
      return next(new AuthenticationError("Invalid token payload"));
    }

    req.auth = payload;

    setSentryUser({
      userId: payload.userId,
      organizationId: payload.organizationId,
      email: payload.email,
    });

    return next();
  } catch {
    return next(new AuthenticationError("Invalid access token"));
  }
};
