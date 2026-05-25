import { NextFunction, Request, Response } from "express";
import { isAppError, toAppError, ValidationError } from "../utils/error";
import { logger, safeStringify } from "../utils/logger";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
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
    }),
  );

  return res.status(appError.statusCode).json({
    success: false,
    code: appError.code,
    message: appError.message,
    ...(validationErrors ? { errors: validationErrors } : {}),
  });
};
