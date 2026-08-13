import { NextFunction, Request, Response } from "express";
import { isAppError, toAppError, ValidationError } from "../utils/error";
import { logger, safeStringify } from "../utils/logger";
import { captureException } from "../config/sentry";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const appError = isAppError(err) ? err : toAppError(err);
  const validationErrors =
    appError instanceof ValidationError ? appError.errors : undefined;

  logger.error(
    safeStringify({
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      method: req.method,
      path: req.originalUrl,
      validationErrors,
      stack: appError.stack,
    })
  );

  // Send 5xx errors to Sentry with request context
  if (appError.statusCode >= 500) {
    captureException(err, {
      code: appError.code,
      statusCode: appError.statusCode,
      method: req.method,
      path: req.originalUrl,
      userId: req.auth?.userId,
      organizationId: req.auth?.organizationId,
    });
  }

  return res.status(appError.statusCode).json({
    success: false,
    code: appError.code,
    message: appError.message,
    ...(validationErrors ? { errors: validationErrors } : {}),
  });
};