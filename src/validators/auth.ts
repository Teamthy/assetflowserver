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
  }),
  registerBaseSchema.extend({
    accountType: z.literal("organization"),
    organizationName: z.string().min(2).max(180),
    organizationSlug: z.string().min(2).max(180).optional(),
  }),
]);

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const organizationLoginSchema = z
  .object({
    organizationSlug: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    email: z.email(),
    password: z.string().min(1),
  })
  .transform((value) => ({
    organizationSlug: value.organizationSlug ?? value.slug ?? "",
    email: value.email,
    password: value.password,
  }))
  .refine((value) => value.organizationSlug.length >= 2, {
    message: "Organization slug is required",
    path: ["organizationSlug"],
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

export const resetPasswordSchema = z
  .object({
    token: z.string().min(4).max(10).optional(),
    otp: z.string().min(4).max(10).optional(),
    newPassword: z.string().min(8),
  })
  .transform((value) => ({
    token: value.token ?? value.otp ?? "",
    newPassword: value.newPassword,
  }))
  .refine((value) => value.token.length >= 4, {
    message: "Reset code is required",
    path: ["token"],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});
