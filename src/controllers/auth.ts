import { NextFunction, Request, Response } from "express";
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
import { AuthenticationError } from "../utils/error";
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from "../utils/cookies";
import { env } from "../config/env";
import { z } from "zod";
import { parseRequestData } from "../utils/controller";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseRequestData(registerSchema, req.body);
    const data = await authService.register(payload);
    setRefreshTokenCookie(
      res,
      data.refreshToken,
      payload.rememberMe ? env.JWT_REFRESH_LONG_EXPIRES_IN : undefined,
    );
    const { refreshToken: _refreshToken, refreshTokenMaxAgeMs: _maxAge, ...safeData } = data;
    res.status(201).json({ success: true, data: safeData });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseRequestData(loginSchema, req.body);
    const data = await authService.login(payload);
    setRefreshTokenCookie(
      res,
      data.refreshToken,
      payload.rememberMe ? env.JWT_REFRESH_LONG_EXPIRES_IN : undefined,
    );
    const { refreshToken: _refreshToken, refreshTokenMaxAgeMs: _maxAge, ...safeData } = data;
    res.status(200).json({ success: true, data: safeData });
  } catch (error) {
    next(error);
  }
};

export const organizationLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseRequestData(organizationLoginSchema, req.body);
    const data = await authService.organizationLogin(payload);
    setRefreshTokenCookie(
      res,
      data.refreshToken,
      payload.rememberMe ? env.JWT_REFRESH_LONG_EXPIRES_IN : undefined,
    );
    const { refreshToken: _refreshToken, refreshTokenMaxAgeMs: _maxAge, ...safeData } = data;
    res.status(200).json({ success: true, data: safeData });
  } catch (error) {
    next(error);
  }
};

export const verifyPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId) {
      throw new AuthenticationError();
    }
    const payload = parseRequestData(verifyPasswordSchema, req.body);
    const data = await authService.verifyPassword({ userId: req.auth.userId, ...payload });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const requestResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseRequestData(requestResetPasswordSchema, req.body);
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
    const payload = parseRequestData(resetPasswordSchema, req.body);
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
    const payload = parseRequestData(changePasswordSchema, req.body);
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
    const bodyToken = parseRequestData(refreshTokenSchema, req.body ?? {}).refreshToken;
    const cookieToken = getRefreshTokenFromRequest(req);
    const refreshToken = cookieToken ?? bodyToken;
    if (!refreshToken) {
      throw new AuthenticationError("Missing refresh token");
    }
    const data = await authService.refreshAuthToken({ refreshToken });
    setRefreshTokenCookie(res, data.refreshToken, data.refreshTokenMaxAgeMs ?? env.JWT_REFRESH_EXPIRES_IN);
    const { refreshToken: _refreshToken, refreshTokenMaxAgeMs: _maxAge, ...safeData } = data;
    res.status(200).json({ success: true, data: safeData });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId || !req.auth.organizationId) {
      throw new AuthenticationError();
    }
    const payload = parseRequestData(logoutSchema, req.body ?? {});
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

const sessionStateSchema = z.object({
  state: z.record(z.string(), z.unknown()).default({}),
});

export const saveSessionState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId || !req.auth.organizationId) {
      throw new AuthenticationError();
    }

    const payload = sessionStateSchema.parse(req.body ?? {});
    const data = await authService.saveSessionState({
      userId: req.auth.userId,
      organizationId: req.auth.organizationId,
      state: payload.state,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getSessionState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId || !req.auth.organizationId) {
      throw new AuthenticationError();
    }

    const data = await authService.getSessionState({
      userId: req.auth.userId,
      organizationId: req.auth.organizationId,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
