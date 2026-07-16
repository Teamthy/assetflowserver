import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { and, eq, isNull } from "drizzle-orm";
import { env } from "../config/env";
import { db } from "../db";
import { organizationUsers, organizations, users } from "../model";
import { AuthenticationError } from "../utils/error";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AuthenticationError("Missing bearer token"));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as jwt.JwtPayload & {
        userId: string;
        organizationId: string;
      };

    if (!payload.userId || !payload.organizationId) {
      return next(new AuthenticationError("Invalid token payload"));
    }

    const [activeContext] = await db
      .select({ userId: users.id })
      .from(users)
      .innerJoin(
        organizationUsers,
        and(
          eq(organizationUsers.userId, users.id),
          eq(organizationUsers.organizationId, payload.organizationId),
          eq(organizationUsers.status, "active"),
        ),
      )
      .innerJoin(organizations, eq(organizations.id, payload.organizationId))
      .where(
        and(
          eq(users.id, payload.userId),
          eq(users.isActive, true),
          isNull(users.deletedAt),
          eq(organizations.isActive, true),
          isNull(organizations.deletedAt),
        ),
      )
      .limit(1);

    if (!activeContext) {
      return next(new AuthenticationError("Invalid access token"));
    }

    req.auth = payload;
    return next();
  } catch {
    return next(new AuthenticationError("Invalid access token"));
  }
};
