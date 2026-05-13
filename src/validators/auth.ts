import { z } from "zod";

export const registerSchema = z.object({
  organizationName: z.string().min(2),
  organizationSlug: z.string().min(2).max(180),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const organizationLoginSchema = z.object({
  organizationSlug: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

export const verifyPasswordSchema = z.object({
  password: z.string().min(8),
});

export const requestResetPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});
