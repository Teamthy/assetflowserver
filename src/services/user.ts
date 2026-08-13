import { and, eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db } from "../db";
import { organizationUsers, organizations, users, userRoles } from "../model";
import {
    getOrganizationMember,
    getOrganizationMembers,
} from "../repositories/users";
import {
    assignRoleToUser,
    getOrganizationRoles,
    getRoleByName,
    getUserRoles,
    removeRoleFromUser,
} from "../repositories/permissions";
import { revokeRefreshTokensForUser } from "../repositories/auth";
import {
    NotFoundError,
    ConflictError,
    AuthorizationError,
    AuthenticationError,
} from "../utils/error";
import { logger } from "../utils/logger";
import { SYSTEM_ROLES } from "../config/permissions";

// ─── List Organization Users ──────────────────────────────────────────────────

export async function listOrganizationUsersService(organizationId: string) {
    return getOrganizationMembers(organizationId);
}

// ─── Get User With Roles ──────────────────────────────────────────────────────

export async function getUserWithRolesService(
    organizationId: string,
    targetUserId: string
) {
    const member = await getOrganizationMember(organizationId, targetUserId);
    if (!member) throw new NotFoundError("User");

    const userRoleList = await getUserRoles(targetUserId, organizationId);

    return { ...member, roles: userRoleList };
}

// ─── Assign Role To User ──────────────────────────────────────────────────────

export async function assignRoleToUserService(input: {
    organizationId: string;
    actorUserId: string;
    targetUserId: string;
    roleId: string;
}) {
    const { organizationId, actorUserId, targetUserId, roleId } = input;

    const member = await getOrganizationMember(organizationId, targetUserId);
    if (!member) throw new NotFoundError("User");

    const orgRoles = await getOrganizationRoles(organizationId);
    const roleExists = orgRoles.find((r) => r.id === roleId);
    if (!roleExists) throw new NotFoundError("Role");

    const currentRoles = await getUserRoles(targetUserId, organizationId);
    const alreadyAssigned = currentRoles.find((r) => r.id === roleId);
    if (alreadyAssigned) {
        throw new ConflictError(`User already has the role: ${roleExists.name}`);
    }

    await assignRoleToUser(organizationId, targetUserId, roleId, actorUserId);

    logger.info("[UserService] Role assigned to user", {
        organizationId,
        targetUserId,
        roleId,
        roleName: roleExists.name,
        assignedBy: actorUserId,
    });

    return {
        message: `Role '${roleExists.name}' assigned successfully`,
        userId: targetUserId,
        roleId,
        roleName: roleExists.name,
    };
}

// ─── Remove Role From User ────────────────────────────────────────────────────

export async function removeRoleFromUserService(input: {
    organizationId: string;
    actorUserId: string;
    targetUserId: string;
    roleId: string;
}) {
    const { organizationId, actorUserId, targetUserId, roleId } = input;

    const member = await getOrganizationMember(organizationId, targetUserId);
    if (!member) throw new NotFoundError("User");

    const orgRoles = await getOrganizationRoles(organizationId);
    const roleExists = orgRoles.find((r) => r.id === roleId);
    if (!roleExists) throw new NotFoundError("Role");

    const currentRoles = await getUserRoles(targetUserId, organizationId);
    const hasRole = currentRoles.find((r) => r.id === roleId);
    if (!hasRole) throw new NotFoundError("Role assignment");

    if (actorUserId === targetUserId && roleExists.name === "admin") {
        throw new AuthorizationError("You cannot remove your own admin role");
    }

    await removeRoleFromUser(organizationId, targetUserId, roleId);

    logger.info("[UserService] Role removed from user", {
        organizationId,
        targetUserId,
        roleId,
        roleName: roleExists.name,
        removedBy: actorUserId,
    });

    return {
        message: `Role '${roleExists.name}' removed successfully`,
        userId: targetUserId,
        roleId,
    };
}

// ─── List Organization Roles ──────────────────────────────────────────────────

export async function listOrganizationRolesService(organizationId: string) {
    return getOrganizationRoles(organizationId);
}

// ─── Suspend User ─────────────────────────────────────────────────────────────

export async function suspendUserService(input: {
    organizationId: string;
    actorUserId: string;
    targetUserId: string;
}) {
    const { organizationId, actorUserId, targetUserId } = input;

    if (actorUserId === targetUserId) {
        throw new AuthorizationError("You cannot suspend your own account");
    }

    const member = await getOrganizationMember(organizationId, targetUserId);
    if (!member) throw new NotFoundError("User");

    if (member.status === "suspended") {
        throw new ConflictError("User is already suspended");
    }

    await db
        .update(organizationUsers)
        .set({ status: "suspended", updatedAt: new Date() })
        .where(
            and(
                eq(organizationUsers.organizationId, organizationId),
                eq(organizationUsers.userId, targetUserId)
            )
        );

    logger.info("[UserService] User suspended", {
        organizationId,
        targetUserId,
        suspendedBy: actorUserId,
    });

    return {
        message: "User suspended successfully",
        userId: targetUserId,
    };
}

// ─── Reactivate User ──────────────────────────────────────────────────────────

export async function reactivateUserService(input: {
    organizationId: string;
    actorUserId: string;
    targetUserId: string;
}) {
    const { organizationId, actorUserId, targetUserId } = input;

    const member = await getOrganizationMember(organizationId, targetUserId);
    if (!member) throw new NotFoundError("User");

    if (member.status === "active") {
        throw new ConflictError("User is already active");
    }

    await db
        .update(organizationUsers)
        .set({ status: "active", updatedAt: new Date() })
        .where(
            and(
                eq(organizationUsers.organizationId, organizationId),
                eq(organizationUsers.userId, targetUserId)
            )
        );

    logger.info("[UserService] User reactivated", {
        organizationId,
        targetUserId,
        reactivatedBy: actorUserId,
    });

    return {
        message: "User reactivated successfully",
        userId: targetUserId,
    };
}

export async function replaceUserRoleService(input: {
    organizationId: string;
    actorUserId: string;
    targetUserId: string;
    roleName: string;
}) {
    const { organizationId, actorUserId, targetUserId, roleName } = input;

    const member = await getOrganizationMember(organizationId, targetUserId);
    if (!member) throw new NotFoundError("User");

    const role = await getRoleByName(organizationId, roleName);
    if (!role) throw new NotFoundError("Role");

    if (actorUserId === targetUserId && roleName !== SYSTEM_ROLES.ADMIN) {
        const currentRoles = await getUserRoles(targetUserId, organizationId);
        if (currentRoles.some((item) => item.name === SYSTEM_ROLES.ADMIN)) {
            throw new AuthorizationError("You cannot remove your own admin role");
        }
    }

    const currentRoles = await getUserRoles(targetUserId, organizationId);
    for (const current of currentRoles) {
        if (current.id !== role.id) {
            await removeRoleFromUser(organizationId, targetUserId, current.id);
        }
    }

    await assignRoleToUser(organizationId, targetUserId, role.id, actorUserId);

    logger.info("[UserService] Primary role replaced", {
        organizationId,
        targetUserId,
        roleName,
        replacedBy: actorUserId,
    });

    return {
        message: `Role updated to '${role.name}'`,
        userId: targetUserId,
        roleId: role.id,
        roleName: role.name,
    };
}

export async function removeUserFromOrganizationService(input: {
    organizationId: string;
    actorUserId: string;
    targetUserId: string;
}) {
    const { organizationId, actorUserId, targetUserId } = input;

    if (actorUserId === targetUserId) {
        throw new AuthorizationError("You cannot remove yourself from the organization");
    }

    const [organization] = await db
        .select({ ownerUserId: organizations.ownerUserId })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

    if (!organization) throw new NotFoundError("Organization");
    if (organization.ownerUserId === targetUserId) {
        throw new AuthorizationError("Transfer ownership before removing the organization owner");
    }

    const member = await getOrganizationMember(organizationId, targetUserId);
    if (!member) throw new NotFoundError("User");

    await db
        .delete(userRoles)
        .where(
            and(
                eq(userRoles.organizationId, organizationId),
                eq(userRoles.userId, targetUserId)
            )
        );

    await db
        .delete(organizationUsers)
        .where(
            and(
                eq(organizationUsers.organizationId, organizationId),
                eq(organizationUsers.userId, targetUserId)
            )
        );

    await revokeRefreshTokensForUser(targetUserId, organizationId);

    logger.info("[UserService] User removed from organization", {
        organizationId,
        targetUserId,
        removedBy: actorUserId,
    });

    return {
        message: "User removed from the organization",
        userId: targetUserId,
    };
}

export async function transferOwnershipService(input: {
    organizationId: string;
    actorUserId: string;
    newOwnerId: string;
    password: string;
}) {
    const { organizationId, actorUserId, newOwnerId, password } = input;

    if (actorUserId === newOwnerId) {
        throw new ConflictError("You already own this organization");
    }

    const [actor] = await db.select().from(users).where(eq(users.id, actorUserId)).limit(1);
    if (!actor) throw new NotFoundError("User");

    const valid = await bcrypt.compare(password, actor.passwordHash);
    if (!valid) {
        throw new AuthenticationError("Password is incorrect");
    }

    const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

    if (!organization) throw new NotFoundError("Organization");
    if (organization.ownerUserId !== actorUserId) {
        throw new AuthorizationError("Only the current owner can transfer ownership");
    }

    const newOwner = await getOrganizationMember(organizationId, newOwnerId);
    if (!newOwner) throw new NotFoundError("User");
    if (newOwner.status !== "active") {
        throw new ConflictError("New owner must be an active organization member");
    }

    const adminRole = await getRoleByName(organizationId, SYSTEM_ROLES.ADMIN);
    if (!adminRole) throw new NotFoundError("Admin role");

    await db
        .update(organizations)
        .set({
            ownerUserId: newOwnerId,
            updatedByUserId: actorUserId,
            updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId));

    await assignRoleToUser(organizationId, newOwnerId, adminRole.id, actorUserId);

    logger.warn("[UserService] Organization ownership transferred", {
        organizationId,
        fromUserId: actorUserId,
        toUserId: newOwnerId,
    });

    return {
        message: "Ownership transferred successfully",
        organizationId,
        newOwnerId,
    };
}