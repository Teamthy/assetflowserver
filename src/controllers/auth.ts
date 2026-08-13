import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  changePasswordSchema,
  loginSchema,
  logoutSchema,
  organizationLoginSchema,
  refreshTokenSchema,
  registerSchema,
  requestResetPasswordSchema,
  resetPasswordSchema,
  verifyPasswordSchema,
} from "../validators/auth";
import * as authService from "../services/auth";
import { AuthenticationError, ValidationError } from "../utils/error";
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from "../utils/cookies";

const parseBody = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError("Validation failed", result.error.issues);
  }
  return result.data;
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseBody(registerSchema, req.body);
    const data = await authService.register(payload);
    setRefreshTokenCookie(res, data.refreshToken);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseBody(loginSchema, req.body);
    const data = await authService.login(payload);
    setRefreshTokenCookie(res, data.refreshToken);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const organizationLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseBody(organizationLoginSchema, req.body);
    const data = await authService.organizationLogin(payload);
    setRefreshTokenCookie(res, data.refreshToken);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const verifyPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId) {
      throw new AuthenticationError();
    }
    const payload = parseBody(verifyPasswordSchema, req.body);
    const data = await authService.verifyPassword({ userId: req.auth.userId, ...payload });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const requestResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseBody(requestResetPasswordSchema, req.body);
    await authService.requestPasswordReset(payload);
    res.status(200).json({
      success: true,
      data: { message: "If this email exists, a reset link was sent." },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseBody(resetPasswordSchema, req.body);
    const data = await authService.resetPassword(payload);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId) {
      throw new AuthenticationError();
    }
    const payload = parseBody(changePasswordSchema, req.body);
    const data = await authService.changePassword({
      userId: req.auth.userId,
      ...payload,
    });
    clearRefreshTokenCookie(res);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bodyToken = parseBody(refreshTokenSchema, req.body ?? {}).refreshToken;
    const cookieToken = getRefreshTokenFromRequest(req);
    const refreshToken = cookieToken ?? bodyToken;
    if (!refreshToken) {
      throw new AuthenticationError("Missing refresh token");
    }
    const data = await authService.refreshAuthToken({ refreshToken });
    setRefreshTokenCookie(res, data.refreshToken);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId || !req.auth.organizationId) {
      throw new AuthenticationError();
    }
    const payload = parseBody(logoutSchema, req.body ?? {});
    const refreshToken = getRefreshTokenFromRequest(req) ?? payload.refreshToken;
    const data = await authService.logout({
      userId: req.auth.userId,
      organizationId: req.auth.organizationId,
      refreshToken,
    });
    clearRefreshTokenCookie(res);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId || !req.auth.organizationId) {
      throw new AuthenticationError();
    }
    const data = await authService.getCurrentSession({
      userId: req.auth.userId,
      organizationId: req.auth.organizationId,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId || !req.auth.organizationId) {
      throw new AuthenticationError();
    }
    const data = await authService.logoutAll({
      userId: req.auth.userId,
      organizationId: req.auth.organizationId,
    });
    clearRefreshTokenCookie(res);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
