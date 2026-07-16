import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env";
import {
  createOrganizationWithOwner,
  createPasswordResetToken,
  findOrganizationBySlug,
  findUserByEmail,
  findUserById,
  findValidPasswordResetToken,
  findValidRefreshToken,
  generateOtp,
  isUserInOrganization,
  listActiveOrganizationMembershipsForUser,
  markPasswordResetUsed,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
  revokeRefreshTokensForUser,
  rotateRefreshToken,
  saveRefreshToken,
  normalizeSlug,
  updateUserPassword,
  saveUserSessionState,
  getUserSessionState,
} from "../repositories/auth";
import { AuthenticationError, ConflictError, NotFoundError } from "../utils/error";
import { logger } from "../utils/logger";
import { createInAppNotification } from "./notifications";
import { seedRolesForNewOrganization } from "../db/seeds/roles.seeder";
import { sendWelcomeEmail } from "./mailer.service";
import { getOrCreateOrganizationSettings } from "../services/organization-settings.service";

const parseDurationMs = (value: StringValue | number): number => {
  if (typeof value === "number") {
    return value;
  }

  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) {
    logger.error("Invalid JWT_REFRESH_EXPIRES_IN format. Expected values like '7d', '12h', '30m', or '60s'.", {
      value,
    });
    throw new Error(`Invalid duration format: "${value}"`);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const unitMap: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return amount * unitMap[unit];
};

const accessExpiresIn = env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"];
const refreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN as StringValue;
const refreshLongExpiresIn = env.JWT_REFRESH_LONG_EXPIRES_IN as StringValue;

const signAccessToken = (payload: { userId: string; organizationId: string; email: string }) => {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: accessExpiresIn });
};

const signRefreshToken = (
  payload: { userId: string; organizationId: string },
  expiresIn: jwt.SignOptions["expiresIn"],
) => {
  if (!env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn,
  });
};

type RegisterInput =
  | {
    accountType: "personal";
    organizationName?: string;
    organizationSlug?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    rememberMe?: boolean;
  }
  | {
    accountType: "organization";
    organizationName: string;
    organizationSlug?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    rememberMe?: boolean;
  };

export const register = async (input: RegisterInput) => {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ConflictError("Email already in use");
  }

  const emailPrefix = input.email.split("@")[0] ?? "user";
  const fallbackSlugBase = normalizeSlug(`${emailPrefix}-${input.firstName}-${input.lastName}`) || "workspace";

  const organizationName =
    input.accountType === "personal"
      ? `${input.firstName} ${input.lastName} Personal Workspace`
      : input.organizationName.trim();

  const organizationSlug =
    input.accountType === "personal"
      ? `${fallbackSlugBase}-${Date.now().toString().slice(-6)}`
      : input.organizationSlug?.trim() || `${normalizeSlug(organizationName)}-${Date.now().toString().slice(-6)}`;

  const passwordHash = await bcrypt.hash(input.password, 12);
  const { owner, organization } = await createOrganizationWithOwner({
    ...input,
    organizationName,
    organizationSlug,
    passwordHash,
  });

  // Seed system roles and permissions for the new organization
  await seedRolesForNewOrganization(organization.id);
  await getOrCreateOrganizationSettings({
    organizationId: organization.id,
    createdByUserId: owner.id,
  });

  // -------------------------------------------------------------------
  //  TERMINAL � New organization registered
  // -------------------------------------------------------------------
  const border = "-".repeat(62);
  console.log("\n");
  console.log(border);
  console.log("  ??  NEW ORGANIZATION REGISTERED");
  console.log(border);
  console.log(`  Organization : ${organization.name}`);
  console.log(`  Slug         : ${organization.slug}`);
  console.log(`  Owner        : ${owner.firstName} ${owner.lastName} <${owner.email}>`);
  console.log(`  Org ID       : ${organization.id}`);
  console.log(`  Registered   : ${new Date().toISOString()}`);
  console.log(`  Login URL    : ${env.APP_URL}/org-login`);
  console.log(border);
  console.log("\n");
  // -------------------------------------------------------------------

  const refreshExpiresInValue = input.rememberMe ? refreshLongExpiresIn : refreshExpiresIn;
  const refreshTokenTtlMsValue = parseDurationMs(refreshExpiresInValue);

  const accessToken = signAccessToken({
    userId: owner.id,
    organizationId: organization.id,
    email: owner.email,
  });
  const refreshToken = signRefreshToken(
    { userId: owner.id, organizationId: organization.id },
    refreshExpiresInValue,
  );

  const refreshExpiresAt = new Date(Date.now() + refreshTokenTtlMsValue);
  await saveRefreshToken(owner.id, organization.id, refreshToken, refreshExpiresAt);

  void sendWelcomeEmail({
    to: owner.email,
    firstName: owner.firstName,
    organizationName: organization.name,
    slug: organization.slug,
  });

  logger.info("User registration successful", {
    userId: owner.id,
    organizationId: organization.id,
    accountType: input.accountType,
    rememberMe: input.rememberMe ?? false,
  });

  return {
    user: {
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
    },
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
    onboarding: {
      welcomeEmailSent: true,
      setupComplete: false,
      nextStep: "accounting-policy",
    },
    accessToken,
    refreshToken,
    refreshTokenMaxAgeMs: refreshTokenTtlMsValue,
  };
};

export const login = async (input: { email: string; password: string; rememberMe?: boolean }) => {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError("Invalid email or password");
  }

  const memberships = await listActiveOrganizationMembershipsForUser(user.id);

  if (memberships.length === 0) {
    throw new NotFoundError("Organization membership");
  }

  if (memberships.length > 1) {
    throw new ConflictError("Multiple organization memberships found. Use organization login.");
  }

  const [orgMembership] = memberships;

  const refreshExpiresInValue = input.rememberMe ? refreshLongExpiresIn : refreshExpiresIn;
  const refreshTokenTtlMsValue = parseDurationMs(refreshExpiresInValue);

  const accessToken = signAccessToken({
    userId: user.id,
    organizationId: orgMembership.organizationId,
    email: user.email,
  });

  const refreshToken = signRefreshToken(
    { userId: user.id, organizationId: orgMembership.organizationId },
    refreshExpiresInValue,
  );

  const refreshExpiresAt = new Date(Date.now() + refreshTokenTtlMsValue);
  await saveRefreshToken(user.id, orgMembership.organizationId, refreshToken, refreshExpiresAt);

  logger.info("User login successful", {
    userId: user.id,
    organizationId: orgMembership.organizationId,
    rememberMe: input.rememberMe ?? false,
  });

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    organization: {
      id: orgMembership.organizationId,
      name: orgMembership.organizationName,
      slug: orgMembership.organizationSlug,
    },
    onboarding: {
      setupComplete: false,
      nextStep: "accounting-policy",
    },
    accessToken,
    refreshToken,
    refreshTokenMaxAgeMs: refreshTokenTtlMsValue,
  };
};

export const organizationLogin = async (input: {
  organizationSlug: string;
  email: string;
  password: string;
  rememberMe?: boolean;
}) => {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new AuthenticationError("Invalid credentials");
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError("Invalid credentials");
  }

  const organization = await findOrganizationBySlug(input.organizationSlug);
  if (!organization) {
    throw new NotFoundError("Organization");
  }

  const membership = await isUserInOrganization(user.id, organization.id);
  if (!membership) {
    throw new AuthenticationError("User does not belong to this organization");
  }

  const refreshExpiresInValue = input.rememberMe ? refreshLongExpiresIn : refreshExpiresIn;
  const refreshTokenTtlMsValue = parseDurationMs(refreshExpiresInValue);

  const accessToken = signAccessToken({
    userId: user.id,
    organizationId: organization.id,
    email: user.email,
  });
  const refreshToken = signRefreshToken(
    { userId: user.id, organizationId: organization.id },
    refreshExpiresInValue,
  );

  const refreshExpiresAt = new Date(Date.now() + refreshTokenTtlMsValue);
  await saveRefreshToken(user.id, organization.id, refreshToken, refreshExpiresAt);

  logger.info("Organization login successful", {
    userId: user.id,
    organizationId: organization.id,
    organizationSlug: organization.slug,
    rememberMe: input.rememberMe ?? false,
  });

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    organization: {
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
    },
    accessToken,
    refreshToken,
    refreshTokenMaxAgeMs: refreshTokenTtlMsValue,
  };
};

export const verifyPassword = async (input: {
  userId: string;
  password: string;
}) => {
  const user = await findUserById(input.userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  return { valid };
};

export const requestPasswordReset = async (input: { email: string }) => {
  const user = await findUserByEmail(input.email);
  if (!user) {
    return;
  }

  const rawToken = generateOtp();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await createPasswordResetToken(user.id, rawToken, expiresAt);

  if (env.LOG_OTP_FOR_DEBUG === true && env.NODE_ENV !== "production") {
    logger.warn("Password reset OTP generated (debug mode)", {
      email: user.email,
      otp: rawToken,
      expiresAt: expiresAt.toISOString(),
    });
  }

  // Temporarily disabled while email domain/provider setup is being finalized.
  // await sendPasswordResetOtpEmail({
  //   to: user.email,
  //   userName: `${user.firstName} ${user.lastName}`,
  //   otp: rawToken,
  //   expiryMinutes: 30,
  // });

  if (env.LOG_OTP_FOR_DEBUG === true && env.NODE_ENV !== "production") {
    logger.info(`OTP email generated: ${user.email} -> ${rawToken}`);
  }

  const [membership] = await listActiveOrganizationMembershipsForUser(user.id);

  if (membership?.organizationId) {
    await createInAppNotification({
      organizationId: membership.organizationId,
      userId: user.id,
      type: "password_reset",
      title: "Password reset requested",
      message: "A password reset OTP was requested for your account.",
      metadata: {
        redirectUrl: "/auth/reset-password",
      },
    });
  }

  logger.info("Password reset OTP sent", { email: input.email.toLowerCase() });
};

export const resetPassword = async (input: { token: string; newPassword: string }) => {
  const tokenRecord = await findValidPasswordResetToken(input.token);
  if (!tokenRecord) {
    throw new AuthenticationError("Invalid or expired reset token");
  }

  const newHash = await bcrypt.hash(input.newPassword, 12);

  await updateUserPassword(tokenRecord.userId, newHash);
  await markPasswordResetUsed(tokenRecord.id);
  await revokeAllRefreshTokensForUser(tokenRecord.userId);

  logger.warn("Password reset successful", { userId: tokenRecord.userId });

  return { message: "Password reset successful" };
};

export const changePassword = async (input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) => {
  const user = await findUserById(input.userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError("Current password is incorrect");
  }

  const newHash = await bcrypt.hash(input.newPassword, 12);

  await updateUserPassword(input.userId, newHash);
  await revokeAllRefreshTokensForUser(input.userId);

  logger.warn("Password changed successfully", { userId: input.userId });

  return { message: "Password changed successfully" };
};

export const refreshAuthToken = async (input: { refreshToken: string }) => {
  let payload: jwt.JwtPayload & { userId: string; organizationId: string };
  try {
    if (!env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is not configured");
    }
    payload = jwt.verify(input.refreshToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload & {
      userId: string;
      organizationId: string;
    };
  } catch {
    throw new AuthenticationError("Invalid refresh token");
  }

  if (!payload.userId || !payload.organizationId) {
    throw new AuthenticationError("Invalid refresh token payload");
  }

  const tokenRecord = await findValidRefreshToken(input.refreshToken);
  if (!tokenRecord) {
    throw new AuthenticationError("Refresh token has been revoked or expired");
  }

  if (tokenRecord.userId !== payload.userId || tokenRecord.organizationId !== payload.organizationId) {
    throw new AuthenticationError("Refresh token payload mismatch");
  }

  const user = await findUserById(payload.userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const originalTtlSeconds =
    typeof payload.exp === "number" && typeof payload.iat === "number"
      ? payload.exp - payload.iat
      : undefined;
  const refreshExpiresInValue =
    originalTtlSeconds && originalTtlSeconds > 0
      ? originalTtlSeconds
      : refreshExpiresIn;
  const refreshTokenTtlMsValue = originalTtlSeconds
    ? originalTtlSeconds * 1000
    : parseDurationMs(refreshExpiresIn);

  const newAccessToken = signAccessToken({
    userId: user.id,
    organizationId: payload.organizationId,
    email: user.email,
  });

  const newRefreshToken = signRefreshToken(
    { userId: user.id, organizationId: payload.organizationId },
    refreshExpiresInValue,
  );

  const refreshExpiresAt = new Date(Date.now() + refreshTokenTtlMsValue);
  await rotateRefreshToken({
    currentRawToken: input.refreshToken,
    userId: user.id,
    organizationId: payload.organizationId,
    nextRawToken: newRefreshToken,
    nextExpiresAt: refreshExpiresAt,
  });

  logger.info("Auth token refreshed", {
    userId: user.id,
    organizationId: payload.organizationId,
    originalTtlSeconds,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    refreshTokenMaxAgeMs: refreshTokenTtlMsValue,
  };
};

export const logout = async (input: {
  userId: string;
  organizationId: string;
  refreshToken?: string;
}) => {
  if (input.refreshToken) {
    await revokeRefreshToken(input.refreshToken);
    logger.info("User logged out (single session)", {
      userId: input.userId,
      organizationId: input.organizationId,
    });
    return { message: "Logged out" };
  }

  await revokeRefreshTokensForUser(input.userId, input.organizationId);
  logger.info("User logged out (all sessions)", {
    userId: input.userId,
    organizationId: input.organizationId,
  });
  return { message: "Logged out from all sessions" };
};

export const logoutAll = async (input: { userId: string; organizationId: string }) => {
  await revokeAllRefreshTokensForUser(input.userId);
  logger.info("User logged out from all sessions across organizations", {
    userId: input.userId,
    organizationId: input.organizationId,
  });
  return { message: "Logged out from all sessions" };
};

export const saveSessionState = async (input: {
  userId: string;
  organizationId: string;
  state: Record<string, unknown>;
}) => {
  const record = await saveUserSessionState({
    userId: input.userId,
    organizationId: input.organizationId,
    state: input.state,
  });

  return { state: record.state as Record<string, unknown> };
};

export const getSessionState = async (input: { userId: string; organizationId: string }) => {
  const record = await getUserSessionState(input.userId, input.organizationId);

  return { state: (record?.state as Record<string, unknown> | undefined) ?? {} };
};

