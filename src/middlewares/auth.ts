import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthenticationError } from "../utils/error";
import { setSentryUser } from "../config/sentry";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AuthenticationError("Missing bearer token"));
  }

  const token = authHeader.slice(7);

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

    // Set Sentry user context for this request
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