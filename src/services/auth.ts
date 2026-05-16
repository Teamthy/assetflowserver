import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
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
  revokeRefreshToken,
  revokeRefreshTokensForUser,
  saveRefreshToken,
  normalizeSlug,
} from "../repositories/auth";
import { AuthenticationError, ConflictError, NotFoundError } from "../utils/error";
import { users } from "../model";
import { organizationUsers } from "../model";
import { sendOnboardingWelcomeEmail, sendPasswordResetOtpEmail } from "./email";

const parseDurationMs = (value: string): number => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

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
const refreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"];

const signAccessToken = (payload: { userId: string; organizationId: string; email: string }) => {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: accessExpiresIn });
};

const signRefreshToken = (payload: { userId: string; organizationId: string }) => {
  if (!env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: refreshExpiresIn });
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

  const accessToken = signAccessToken({
    userId: owner.id,
    organizationId: organization.id,
    email: owner.email,
  });
  const refreshToken = signRefreshToken({ userId: owner.id, organizationId: organization.id });

  const refreshExpiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));
  await saveRefreshToken(owner.id, organization.id, refreshToken, refreshExpiresAt);

  await sendOnboardingWelcomeEmail({
    to: owner.email,
    firstName: owner.firstName,
    organizationName: organization.name,
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
    accessToken,
    refreshToken,
  };
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

  const [orgMembership] = await db
    .select()
    .from(organizationUsers)
    .where(eq(organizationUsers.userId, user.id))
    .limit(1);

  if (!orgMembership) {
    throw new NotFoundError("Organization membership");
  }

  const accessToken = signAccessToken({
    userId: user.id,
    organizationId: orgMembership.organizationId,
    email: user.email,
  });

  const refreshToken = signRefreshToken({
    userId: user.id,
    organizationId: orgMembership.organizationId,
  });

  const refreshExpiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));
  await saveRefreshToken(user.id, orgMembership.organizationId, refreshToken, refreshExpiresAt);

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    organizationId: orgMembership.organizationId,
    accessToken,
    refreshToken,
  };
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

  const accessToken = signAccessToken({
    userId: user.id,
    organizationId: organization.id,
    email: user.email,
  });
  const refreshToken = signRefreshToken({ userId: user.id, organizationId: organization.id });

  const refreshExpiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));
  await saveRefreshToken(user.id, organization.id, refreshToken, refreshExpiresAt);

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
  await sendPasswordResetOtpEmail({
    to: user.email,
    userName: `${user.firstName} ${user.lastName}`,
    otp: rawToken,
    expiryMinutes: 30,
  });
};

export const resetPassword = async (input: { token: string; newPassword: string }) => {
  const tokenRecord = await findValidPasswordResetToken(input.token);
  if (!tokenRecord) {
    throw new AuthenticationError("Invalid or expired reset token");
  }

  const newHash = await bcrypt.hash(input.newPassword, 12);

  await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, tokenRecord.userId));
  await markPasswordResetUsed(tokenRecord.id);

  return { message: "Password reset successful" };
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

  const tokenRecord = await findValidRefreshToken(input.refreshToken);
  if (!tokenRecord) {
    throw new AuthenticationError("Refresh token has been revoked or expired");
  }

  await revokeRefreshToken(input.refreshToken);

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

  const refreshExpiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));
  await saveRefreshToken(user.id, payload.organizationId, newRefreshToken, refreshExpiresAt);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logout = async (input: {
  userId: string;
  organizationId: string;
  refreshToken?: string;
}) => {
  if (input.refreshToken) {
    await revokeRefreshToken(input.refreshToken);
    return { message: "Logged out" };
  }

  await revokeRefreshTokensForUser(input.userId, input.organizationId);
  return { message: "Logged out from all sessions" };
};
