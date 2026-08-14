import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { env } from "../config/env";
import { organizations, users } from "../model";
import { getUserRoles } from "../repositories/permissions";
import { saveRefreshToken } from "../repositories/auth";
import { NotFoundError } from "../utils/error";
import { logger } from "../utils/logger";

const ROLE_RANK: Record<string, number> = {
  admin: 100,
  asset_manager: 80,
  finance: 70,
  branch_manager: 60,
  auditor: 50,
  maintenance_staff: 40,
  standard_staff: 10,
};

const parseDurationMs = (value: string): number => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) {
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
const refreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"];
const refreshTokenTtlMs = parseDurationMs(env.JWT_REFRESH_EXPIRES_IN);

export const pickPrimaryRole = (roleNames: string[]): string => {
  if (roleNames.length === 0) return "standard_staff";
  return [...roleNames].sort((a, b) => (ROLE_RANK[b] ?? 0) - (ROLE_RANK[a] ?? 0))[0];
};

export const signAccessToken = (payload: {
  userId: string;
  organizationId: string;
  email: string;
}) => {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: accessExpiresIn });
};

export const signRefreshToken = (payload: { userId: string; organizationId: string }) => {
  if (!env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: refreshExpiresIn });
};

export async function loadMembershipContext(userId: string, organizationId: string) {
  const [[user], [organization], roleRows] = await Promise.all([
    db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        ownerUserId: organizations.ownerUserId,
        multiBranchEnabled: organizations.multiBranchEnabled,
      })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1),
    getUserRoles(userId, organizationId),
  ]);

  if (!user) throw new NotFoundError("User");
  if (!organization) throw new NotFoundError("Organization");

  const roles = roleRows.map((role) => role.name);
  const role = pickPrimaryRole(roles);

  return { user, organization, role, roles };
}

export async function issueAuthSession(userId: string, organizationId: string) {
  const context = await loadMembershipContext(userId, organizationId);

  const accessToken = signAccessToken({
    userId: context.user.id,
    organizationId: context.organization.id,
    email: context.user.email,
  });
  const refreshToken = signRefreshToken({
    userId: context.user.id,
    organizationId: context.organization.id,
  });

  await saveRefreshToken(
    context.user.id,
    context.organization.id,
    refreshToken,
    new Date(Date.now() + refreshTokenTtlMs),
  );

  logger.info("Auth session issued", {
    userId: context.user.id,
    organizationId: context.organization.id,
    role: context.role,
  });

  return {
    user: context.user,
    organization: {
      id: context.organization.id,
      name: context.organization.name,
      slug: context.organization.slug,
      isMultiBranch: context.organization.multiBranchEnabled,
      ownerUserId: context.organization.ownerUserId,
    },
    role: context.role,
    roles: context.roles,
    accessToken,
    refreshToken,
  };
}

export { refreshTokenTtlMs };
