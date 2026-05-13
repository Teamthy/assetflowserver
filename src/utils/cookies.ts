import { Request, Response } from "express";
import { env } from "../config/env";

const parseDurationMs = (value: string): number => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = match[2];
  const unitMap: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return amount * unitMap[unit];
};

export const REFRESH_COOKIE_NAME = "refreshToken";

export const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE ?? env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE ?? env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  });
};

export const getRefreshTokenFromRequest = (req: Request): string | undefined => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(";");
  for (const part of cookies) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key === REFRESH_COOKIE_NAME) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return undefined;
};
