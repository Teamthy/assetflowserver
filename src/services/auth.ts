import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { env } from "../config/env";
import {
  createOrganizationWithOwner,
  createPasswordResetToken,
  findOrganizationBySlug,
  findUserByEmail,
  findValidPasswordResetToken,
  findValidRefreshToken,
  generateOtp,
  isUserInOrganization,
  markPasswordResetUsed,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
  revokeRefreshTokensForUser,
  rotateRefreshToken,
  normalizeSlug,
} from "../repositories/auth";
import { AuthenticationError, ConflictError, NotFoundError } from "../utils/error";
import { organizations, users } from "../model";
import { organizationUsers } from "../model";
import { logger } from "../utils/logger";
import { createInAppNotification } from "./notifications";
import { seedRolesForNewOrganization } from "../db/seeds/roles.seeder";
import {
  issueAuthSession,
  loadMembershipContext,
  refreshTokenTtlMs,
  signAccessToken,
  signRefreshToken,
} from "./auth-session";

type RegisterInput =
  | {
    accountType: "personal";
    organizationName?: string;
    organizationSlug?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }
  | {
    accountType: "organization";
    organizationName: string;
    organizationSlug?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
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

  logger.info("User registration successful", {
    userId: owner.id,
    organizationId: organization.id,
    accountType: input.accountType,
  });

  return issueAuthSession(owner.id, organization.id);
};

export const login = async (input: { email: string; password: string }) => {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError("Invalid email or password");
  }

  const memberships = await db
    .select({
      organizationId: organizationUsers.organizationId,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
    })
    .from(organizationUsers)
    .innerJoin(organizations, eq(organizations.id, organizationUsers.organizationId))
    .where(and(eq(organizationUsers.userId, user.id), eq(organizationUsers.status, "active")))
    .orderBy(asc(organizationUsers.joinedAt), asc(organizationUsers.createdAt))
    .limit(2);

  if (memberships.length === 0) {
    throw new NotFoundError("Organization membership");
  }

  if (memberships.length > 1) {
    throw new ConflictError("Multiple organization memberships found. Use organization login.");
  }

  const [orgMembership] = memberships;

  logger.info("User login successful", {
    userId: user.id,
    organizationId: orgMembership.organizationId,
  });

  return issueAuthSession(user.id, orgMembership.organizationId);
};

export const organizationLogin = async (input: {
  organizationSlug: string;
  email: string;
  password: string;
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

  logger.info("Organization login successful", {
    userId: user.id,
    organizationId: organization.id,
    organizationSlug: organization.slug,
  });

  return issueAuthSession(user.id, organization.id);
};

export const getCurrentSession = async (input: { userId: string; organizationId: string }) => {
  const context = await loadMembershipContext(input.userId, input.organizationId);
  return {
    user: context.user,
    organization: {
      id: context.organization.id,
      name: context.organization.name,
      slug: context.organization.slug,
      isMultiBranch: context.organization.multiBranchEnabled,
    },
    role: context.role,
    roles: context.roles,
  };
};

export const verifyPassword = async (input: {
  userId: string;
  password: string;
}) => {
  const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
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

  const [membership] = await db
    .select({ organizationId: organizationUsers.organizationId })
    .from(organizationUsers)
    .where(eq(organizationUsers.userId, user.id))
    .limit(1);

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

  await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, tokenRecord.userId));
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
  const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  if (!user) {
    throw new NotFoundError("User");
  }

  const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError("Current password is incorrect");
  }

  const newHash = await bcrypt.hash(input.newPassword, 12);

  await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, input.userId));
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

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  if (!user) {
    throw new NotFoundError("User");
  }

  const newAccessToken = signAccessToken({
    userId: user.id,
    organizationId: payload.organizationId,
    email: user.email,
  });

  const newRefreshToken = signRefreshToken({
    userId: user.id,
    organizationId: payload.organizationId,
  });

  const refreshExpiresAt = new Date(Date.now() + refreshTokenTtlMs);
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
  });

  const context = await loadMembershipContext(user.id, payload.organizationId);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    role: context.role,
    roles: context.roles,
    user: context.user,
    organization: {
      id: context.organization.id,
      name: context.organization.name,
      slug: context.organization.slug,
      isMultiBranch: context.organization.multiBranchEnabled,
    },
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
