import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { organizationUsers } from "../model";
import {
    getOrganizationMember,
    getOrganizationMembers,
} from "../repositories/users";
import {
    assignRoleToUser,
    getOrganizationRoles,
    getUserRoles,
    removeRoleFromUser,
} from "../repositories/permissions";
import {
    NotFoundError,
    ConflictError,
    AuthorizationError,
} from "../utils/error";
import { logger } from "../utils/logger";

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