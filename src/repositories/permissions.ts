import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import {
    permissions,
    rolePermissions,
    roles,
    userRoles,
} from "../model";
import { PermissionKey } from "../config/permissions";

/**
 * Get all permission keys assigned to a user within an organization.
 * Joins: user_roles → roles → role_permissions → permissions
 * Only returns permissions from active (non-deleted) roles.
 */
export async function getUserPermissions(
    userId: string,
    organizationId: string
): Promise<PermissionKey[]> {
    const rows = await db
        .select({ key: permissions.key })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
            and(
                eq(userRoles.userId, userId),
                eq(userRoles.organizationId, organizationId),
                isNull(roles.deletedAt)
            )
        );

    return rows.map((r) => r.key as PermissionKey);
}

/**
 * Check if a user has a specific permission within an organization.
 * More efficient than fetching all permissions when you only need one check.
 */
export async function userHasPermission(
    userId: string,
    organizationId: string,
    permissionKey: PermissionKey
): Promise<boolean> {
    const rows = await db
        .select({ key: permissions.key })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
            and(
                eq(userRoles.userId, userId),
                eq(userRoles.organizationId, organizationId),
                eq(permissions.key, permissionKey),
                isNull(roles.deletedAt)
            )
        );

    return rows.length > 0;
}

/**
 * Check if a user has ALL of the specified permissions.
 * Used when an action requires multiple permissions simultaneously.
 */
export async function userHasAllPermissions(
    userId: string,
    organizationId: string,
    permissionKeys: PermissionKey[]
): Promise<boolean> {
    if (permissionKeys.length === 0) return true;

    const rows = await db
        .select({ key: permissions.key })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
            and(
                eq(userRoles.userId, userId),
                eq(userRoles.organizationId, organizationId),
                inArray(permissions.key, permissionKeys),
                isNull(roles.deletedAt)
            )
        );

    const foundKeys = new Set(rows.map((r) => r.key));
    return permissionKeys.every((key) => foundKeys.has(key));
}

/**
 * Get all roles assigned to a user within an organization.
 * Returns role names for display/logging purposes.
 */
export async function getUserRoles(
    userId: string,
    organizationId: string
): Promise<{ id: string; name: string; isSystem: boolean }[]> {
    const rows = await db
        .select({
            id: roles.id,
            name: roles.name,
            isSystem: roles.isSystem,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
            and(
                eq(userRoles.userId, userId),
                eq(userRoles.organizationId, organizationId),
                isNull(roles.deletedAt)
            )
        );

    return rows;
}

/**
 * Get a role by name within an organization.
 * Used during seeding and role assignment.
 */
export async function getRoleByName(
    organizationId: string,
    name: string
): Promise<{ id: string; name: string; isSystem: boolean } | null> {
    const rows = await db
        .select({
            id: roles.id,
            name: roles.name,
            isSystem: roles.isSystem,
        })
        .from(roles)
        .where(
            and(
                eq(roles.organizationId, organizationId),
                eq(roles.name, name),
                isNull(roles.deletedAt)
            )
        );

    return rows[0] ?? null;
}

/**
 * Get all roles for an organization.
 * Used by admin UI to display available roles.
 */
export async function getOrganizationRoles(
    organizationId: string
): Promise<{ id: string; name: string; description: string | null; isSystem: boolean }[]> {
    const rows = await db
        .select({
            id: roles.id,
            name: roles.name,
            description: roles.description,
            isSystem: roles.isSystem,
        })
        .from(roles)
        .where(
            and(
                eq(roles.organizationId, organizationId),
                isNull(roles.deletedAt)
            )
        );

    return rows;
}

/**
 * Get all permissions for a role.
 * Used by admin UI to display role capabilities.
 */
export async function getRolePermissions(
    roleId: string
): Promise<{ key: string; description: string | null }[]> {
    const rows = await db
        .select({
            key: permissions.key,
            description: permissions.description,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId));

    return rows;
}

/**
 * Assign a role to a user within an organization.
 * Silently succeeds if already assigned (idempotent).
 */
export async function assignRoleToUser(
    organizationId: string,
    userId: string,
    roleId: string,
    assignedByUserId: string
): Promise<void> {
    await db
        .insert(userRoles)
        .values({
            organizationId,
            userId,
            roleId,
            assignedByUserId,
        })
        .onConflictDoNothing();
}

/**
 * Remove a role from a user within an organization.
 */
export async function removeRoleFromUser(
    organizationId: string,
    userId: string,
    roleId: string
): Promise<void> {
    await db
        .delete(userRoles)
        .where(
            and(
                eq(userRoles.organizationId, organizationId),
                eq(userRoles.userId, userId),
                eq(userRoles.roleId, roleId)
            )
        );
}