import { Request } from "express";
import { z } from "zod";
import { AuthenticationError, ValidationError } from "./error";

type AuthContextOptions = {
  requireUser?: boolean;
  requireOrganization?: boolean;
};

export type AuthContext = {
  userId: string;
  organizationId: string;
};

export const parseRequestData = <T>(schema: z.ZodType<T>, payload: unknown): T => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ValidationError("Validation failed", result.error.issues);
  }
  return result.data;
};

export const getAuthenticatedContext = (
  req: Request,
  options: AuthContextOptions = {},
): AuthContext => {
  const { requireUser = true, requireOrganization = true } = options;
  const userId = req.auth?.userId;
  const organizationId = req.auth?.organizationId;

  if ((requireUser && !userId) || (requireOrganization && !organizationId)) {
    throw new AuthenticationError();
  }

  return {
    userId: userId ?? "",
    organizationId: organizationId ?? "",
  };
};
