import { NextFunction, Request, Response } from "express";
import { isAppError, toAppError, ValidationError } from "../utils/error";
import { logger, safeStringify } from "../utils/logger";

const getErrorDetails = (err: unknown) => {
  if (!err || typeof err !== "object") return undefined;

  const error = err as {
    name?: unknown;
    code?: unknown;
    message?: unknown;
    cause?: {
      name?: unknown;
      code?: unknown;
      message?: unknown;
    };
  };

  return {
    name: error.name,
    code: error.code,
    message: error.message,
    cause: error.cause
      ? {
          name: error.cause.name,
          code: error.cause.code,
          message: error.cause.message,
        }
      : undefined,
  };
};

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
      error: getErrorDetails(err),
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
