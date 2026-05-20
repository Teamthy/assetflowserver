import { NextFunction, Request, Response } from "express";
import { isAppError, toAppError, ValidationError } from "../utils/error";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const appError = isAppError(err) ? err : toAppError(err);

  return res.status(appError.statusCode).json({
    success: false,
    code: appError.code,
    message: appError.message,
    ...(appError instanceof ValidationError ? { errors: appError.errors } : {}),
  });
};
