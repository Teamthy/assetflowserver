import crypto from "crypto";
import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import { env } from "../config/env";
import { AuthenticationError } from "../utils/error";
import {
  organizationUsers,
  organizations,
  passwordResetTokens,
  permissions,
  plans,
  refreshTokens,
  rolePermissions,
  roles,
  userRoles,
  userSessionState,
  users,
} from "../model";

export const normalizeSlug = (slug: string) =>
  slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(`${token}:${env.TOKEN_HASH_PEPPER}`).digest("hex");

export const generateToken = () => crypto.randomBytes(32).toString("hex");
export const generateOtp = () => String(crypto.randomInt(100000, 1000000));

export const findUserByEmail = async (email: string) => {
  const [record] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return record;
};

export const createUser = async (input: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  isActive?: boolean;
}) => {
  const [record] = await db
    .insert(users)
    .values({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      isActive: input.isActive ?? false,
    })
    .returning();

  return record;
};

export const updateUserById = async (userId: string, payload: Record<string, unknown>) => {
  const [record] = await db
    .update(users)
    .set({ ...payload, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return record;
};

export const findUserById = async (userId: string) => {
  const [record] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return record;
};

export const listActiveOrganizationMembershipsForUser = async (userId: string) => {
  return db
    .select({
      organizationId: organizationUsers.organizationId,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
    })
    .from(organizationUsers)
    .innerJoin(organizations, eq(organizations.id, organizationUsers.organizationId))
    .where(and(eq(organizationUsers.userId, userId), eq(organizationUsers.status, "active")))
    .orderBy(asc(organizationUsers.joinedAt), asc(organizationUsers.createdAt));
};

export const updateUserPassword = async (userId: string, passwordHash: string) => {
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
};

export const findOrganizationBySlug = async (slug: string) => {
  const [record] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, normalizeSlug(slug)))
    .limit(1);
  return record;
};

export const isUserInOrganization = async (userId: string, organizationId: string) => {
  const [record] = await db
    .select()
    .from(organizationUsers)
    .where(
      and(
        eq(organizationUsers.userId, userId),
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.status, "active"),
      ),
    )
    .limit(1);
  return record;
};

export const saveRefreshToken = async (
  userId: string,
  organizationId: string,
  rawToken: string,
  expiresAt: Date,
) => {
  await db.insert(refreshTokens).values({
    userId,
    organizationId,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });
};

export const findValidRefreshToken = async (rawToken: string) => {
  const tokenHash = hashToken(rawToken);
  const [record] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        eq(refreshTokens.isRevoked, false),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return record;
};

export const revokeRefreshToken = async (rawToken: string) => {
  const tokenHash = hashToken(rawToken);
  await db
    .update(refreshTokens)
    .set({ isRevoked: true, revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
};

export const revokeRefreshTokensForUser = async (userId: string, organizationId: string) => {
  await db
    .update(refreshTokens)
    .set({ isRevoked: true, revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.organizationId, organizationId)));
};

export const revokeAllRefreshTokensForUser = async (userId: string) => {
  await db
    .update(refreshTokens)
    .set({ isRevoked: true, revokedAt: new Date() })
    .where(eq(refreshTokens.userId, userId));
};

export const rotateRefreshToken = async (input: {
  currentRawToken: string;
  userId: string;
  organizationId: string;
  nextRawToken: string;
  nextExpiresAt: Date;
}) => {
  const currentTokenHash = hashToken(input.currentRawToken);

  await db.transaction(async (tx) => {
    const revokedTokens = await tx
      .update(refreshTokens)
      .set({ isRevoked: true, revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.tokenHash, currentTokenHash),
          eq(refreshTokens.isRevoked, false),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .returning({ id: refreshTokens.id });

    if (revokedTokens.length === 0) {
      throw new AuthenticationError("Refresh token has been revoked or expired");
    }

    await tx.insert(refreshTokens).values({
      userId: input.userId,
      organizationId: input.organizationId,
      tokenHash: hashToken(input.nextRawToken),
      expiresAt: input.nextExpiresAt,
    });
  });
};

export const saveUserSessionState = async (input: {
  userId: string;
  organizationId: string;
  state: Record<string, unknown>;
}) => {
  const existing = await db
    .select()
    .from(userSessionState)
    .where(and(eq(userSessionState.userId, input.userId), eq(userSessionState.organizationId, input.organizationId)))
    .limit(1);

  if (existing[0]) {
    const [record] = await db
      .update(userSessionState)
      .set({ state: input.state, updatedAt: new Date() })
      .where(and(eq(userSessionState.userId, input.userId), eq(userSessionState.organizationId, input.organizationId)))
      .returning();

    return record;
  }

  const [record] = await db
    .insert(userSessionState)
    .values({
      userId: input.userId,
      organizationId: input.organizationId,
      state: input.state,
    })
    .returning();

  return record;
};

export const getUserSessionState = async (userId: string, organizationId: string) => {
  const [record] = await db
    .select()
    .from(userSessionState)
    .where(and(eq(userSessionState.userId, userId), eq(userSessionState.organizationId, organizationId)))
    .limit(1);

  return record ?? null;
};

export const createPasswordResetToken = async (userId: string, rawToken: string, expiresAt: Date) => {
  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });
};

export const findValidPasswordResetToken = async (rawToken: string) => {
  const tokenHash = hashToken(rawToken);
  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())))
    .limit(1);
  return record;
};

export const markPasswordResetUsed = async (id: string) => {
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
};

export const createOrganizationWithOwner = async (input: {
  organizationName: string;
  organizationSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}) => {
  return db.transaction(async (tx) => {
    const readOnlyPermissionSeeds: Array<{ key: string; description: string }> = [
      { key: "assets.read", description: "View assets" },
      { key: "branches.read", description: "View branches" },
      { key: "audit.read", description: "View audit data" },
      { key: "reports.read", description: "View reports" },
    ];

    const [starterPlan] = await tx
      .insert(plans)
      .values({ name: "Starter", code: "starter", maxStaff: 10 })
      .onConflictDoUpdate({
        target: plans.code,
        set: { name: "Starter" },
      })
      .returning();

    const [owner] = await tx
      .insert(users)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
      })
      .returning();

    const [organization] = await tx
      .insert(organizations)
      .values({
        name: input.organizationName,
        slug: normalizeSlug(input.organizationSlug),
        planId: starterPlan.id,
        ownerUserId: owner.id,
        createdByUserId: owner.id,
        updatedByUserId: owner.id,
        currentSeatCount: 1,
      })
      .returning();

    await tx.insert(organizationUsers).values({
      organizationId: organization.id,
      userId: owner.id,
      status: "active",
      joinedAt: new Date(),
      invitedByUserId: owner.id,
    });

    const [adminRole] = await tx
      .insert(roles)
      .values({
        organizationId: organization.id,
        name: "admin",
        description: "Organization administrator",
        isSystem: true,
        createdByUserId: owner.id,
        updatedByUserId: owner.id,
      })
      .returning();

    const [auditorRole] = await tx
      .insert(roles)
      .values({
        organizationId: organization.id,
        name: "auditor",
        description: "Read-only audit and reporting access",
        isSystem: true,
        createdByUserId: owner.id,
        updatedByUserId: owner.id,
      })
      .returning();

    await tx
      .insert(permissions)
      .values(readOnlyPermissionSeeds)
      .onConflictDoNothing();

    const permissionRecords = await tx
      .select({ id: permissions.id, key: permissions.key })
      .from(permissions)
      .where(inArray(permissions.key, readOnlyPermissionSeeds.map((item) => item.key)));

    if (permissionRecords.length > 0) {
      await tx
        .insert(rolePermissions)
        .values(
          permissionRecords.map((permission) => ({
            roleId: auditorRole.id,
            permissionId: permission.id,
          })),
        )
        .onConflictDoNothing();
    }

    await tx.insert(userRoles).values({
      organizationId: organization.id,
      userId: owner.id,
      roleId: adminRole.id,
      assignedByUserId: owner.id,
    });

    return { owner, organization };
  });
};
