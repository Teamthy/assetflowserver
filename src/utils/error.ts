export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_SERVER_ERROR",
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  errors: any[];

  constructor(message: string, errors: any[]) {
    super(message, 400, "VALIDATION_ERROR", true);
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_REQUIRED", true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Permission denied") {
    super(message, 403, "PERMISSION_DENIED", true);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string = "Resource") {
    super(`${entity} not found`, 404, "RESOURCE_NOT_FOUND", true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "RESOURCE_CONFLICT", true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_EXCEEDED", true);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, isOperational: boolean = false) {
    super(message, 500, "DATABASE_ERROR", isOperational);
  }
}

export class ExternalServiceError extends AppError {
  service: string;

  constructor(
    service: string,
    message: string,
    isOperational: boolean = false,
  ) {
    super(
      `${service} service error: ${message}`,
      502,
      "EXTERNAL_SERVICE_ERROR",
      isOperational,
    );
    this.service = service;
  }
}

export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

const isDatabaseDriverError = (error: any): boolean => {
  if (!error || typeof error !== "object") return false;

  const message = typeof error.message === "string" ? error.message : "";
  const cause = error.cause;
  const causeMessage =
    cause && typeof cause.message === "string" ? cause.message : "";
  const causeCode = cause && typeof cause.code === "string" ? cause.code : "";
  const code = typeof error.code === "string" ? error.code : "";
  const connectionErrorCodes = new Set([
    "ECONNREFUSED",
    "ECONNRESET",
    "ENOTFOUND",
    "ETIMEDOUT",
    "EAI_AGAIN",
  ]);

  return (
    message.startsWith("Failed query:") ||
    message.includes("Connection terminated due to connection timeout") ||
    causeMessage.includes("Connection terminated due to connection timeout") ||
    connectionErrorCodes.has(code) ||
    connectionErrorCodes.has(causeCode) ||
    causeCode.startsWith("PG") ||
    code.startsWith("PG")
  );
};

export const toAppError = (error: any): AppError => {
  if (isAppError(error)) return error;

  if (error?.name === "ZodError" && Array.isArray(error?.issues)) {
    return new ValidationError("Validation failed", error.issues);
  }

  if (error?.name === "MulterError") {
    return new ValidationError("File upload error", [error]);
  }

  if (error?.name === "JsonWebTokenError") {
    return new AuthenticationError("Invalid token");
  }

  if (error?.name === "TokenExpiredError") {
    return new AuthenticationError("Token expired");
  }

  if (isDatabaseDriverError(error)) {
    return new DatabaseError("Database request failed", true);
  }

  return new AppError(
    error?.message || "An unexpected error occurred",
    500,
    "INTERNAL_SERVER_ERROR",
    false,
  );
};
