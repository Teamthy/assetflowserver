import { z } from "zod";

const registerBaseSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

export const registerSchema = z.discriminatedUnion("accountType", [
  registerBaseSchema.extend({
    accountType: z.literal("personal"),
    organizationName: z.string().min(2).max(180).optional(),
    organizationSlug: z.string().min(2).max(180).optional(),
    rememberMe: z.boolean().optional(),
  }),
  registerBaseSchema.extend({
    accountType: z.literal("organization"),
    organizationName: z.string().min(2).max(180),
    organizationSlug: z.string().min(2).max(180).optional(),
    rememberMe: z.boolean().optional(),
  }),
]);

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const organizationLoginSchema = z.object({
  organizationSlug: z.string().min(2),
  email: z.email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const verifyPasswordSchema = z.object({
  password: z.string().min(8),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export const requestResetPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().length(6),
  newPassword: z.string().min(8),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});
