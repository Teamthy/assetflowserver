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
import {
    NotFoundError,
    ConflictError,
    AuthorizationError,
} from "../utils/error";
import { logger } from "../utils/logger";

// ─── List Organization Users ──────────────────────────────────────────────────

export async function listOrganizationUsersService(organizationId: string) {
    const members = await getOrganizationMembers(organizationId);
    return members;
}

// ─── Get User With Roles ──────────────────────────────────────────────────────

export async function getUserWithRolesService(
    organizationId: string,
    targetUserId: string
) {
    // Verify user is a member of the organization
    const member = await getOrganizationMember(organizationId, targetUserId);
    if (!member) {
        throw new NotFoundError("User");
    }

    // Get their roles
    const userRoleList = await getUserRoles(targetUserId, organizationId);

    return {
        ...member,
        roles: userRoleList,
    };
}

// ─── Assign Role To User ──────────────────────────────────────────────────────

export async function assignRoleToUserService(input: {
    organizationId: string;
    actorUserId: string;
    targetUserId: string;
    roleId: string;
}) {
    const { organizationId, actorUserId, targetUserId, roleId } = input;

    // Verify target user is a member of the organization
    const member = await getOrganizationMember(organizationId, targetUserId);
    if (!member) {
        throw new NotFoundError("User");
    }

    // Verify the role belongs to this organization
    const orgRoles = await getOrganizationRoles(organizationId);
    const roleExists = orgRoles.find((r) => r.id === roleId);
    if (!roleExists) {
        throw new NotFoundError("Role");
    }

    // Check if user already has this role
    const currentRoles = await getUserRoles(targetUserId, organizationId);
    const alreadyAssigned = currentRoles.find((r) => r.id === roleId);
    if (alreadyAssigned) {
        throw new ConflictError(
            `User already has the role: ${roleExists.name}`
        );
    }

    // Assign the role
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

    // Verify target user is a member of the organization
    const member = await getOrganizationMember(organizationId, targetUserId);
    if (!member) {
        throw new NotFoundError("User");
    }

    // Verify the role belongs to this organization
    const orgRoles = await getOrganizationRoles(organizationId);
    const roleExists = orgRoles.find((r) => r.id === roleId);
    if (!roleExists) {
        throw new NotFoundError("Role");
    }

    // Prevent removing last role if it's admin
    // (prevents locking out the organization)
    const currentRoles = await getUserRoles(targetUserId, organizationId);
    const hasRole = currentRoles.find((r) => r.id === roleId);
    if (!hasRole) {
        throw new NotFoundError("Role assignment");
    }

    // Prevent actor from removing their own admin role
    if (
        actorUserId === targetUserId &&
        roleExists.name === "admin"
    ) {
        throw new AuthorizationError(
            "You cannot remove your own admin role"
        );
    }

    // Remove the role
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
    const roles = await getOrganizationRoles(organizationId);
    return roles;
}