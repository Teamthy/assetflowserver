import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import {
    permissions,
    rolePermissions,
    roles,
    userRoles,
} from "../model/user";


export const findUserPermissionKeys = async (
    userId: string,
    organizationId: string,
): Promise<string[]> => {
    const rows = await db
        .select({ key: permissions.key })
        .from(userRoles)
        .innerJoin(
            roles,
            and(
                eq(roles.id, userRoles.roleId),
                isNull(roles.deletedAt),
            ),
        )
        .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .where(
            and(
                eq(userRoles.userId, userId),
                eq(userRoles.organizationId, organizationId),
            ),
        );


    return Array.from(new Set(rows.map((row) => row.key)));
};


export const findUserRoles = async (
    userId: string,
    organizationId: string,
) => {
    return db
        .select({
            id: roles.id,
            name: roles.name,
            description: roles.description,
            isSystem: roles.isSystem,
        })
        .from(userRoles)
        .innerJoin(
            roles,
            and(
                eq(roles.id, userRoles.roleId),
                isNull(roles.deletedAt),
            ),
        )
        .where(
            and(
                eq(userRoles.userId, userId),
                eq(userRoles.organizationId, organizationId),
            ),
        );
};


export const findRoleByName = async (
    organizationId: string,
    name: string,
) => {
    const [role] = await db
        .select()
        .from(roles)
        .where(
            and(
                eq(roles.organizationId, organizationId),
                eq(roles.name, name),
                isNull(roles.deletedAt),
            ),
        )
        .limit(1);
    return role ?? null;
};


export const findPermissionIdsByKeys = async (
    keys: string[],
): Promise<{ id: string; key: string }[]> => {
    if (keys.length === 0) return [];
    return db
        .select({ id: permissions.id, key: permissions.key })
        .from(permissions)
        .where(inArray(permissions.key, keys));
};


export const upsertPermissions = async (
    entries: { key: string; description: string }[],
) => {
    if (entries.length === 0) return;
    await db
        .insert(permissions)
        .values(entries)
        .onConflictDoNothing({ target: permissions.key });
};


export const createSystemRole = async (params: {
    organizationId: string;
    name: string;
    description: string;
    createdByUserId?: string | null;
}) => {
    const existing = await findRoleByName(params.organizationId, params.name);
    if (existing) return existing;

    const [role] = await db
        .insert(roles)
        .values({
            organizationId: params.organizationId,
            name: params.name,
            description: params.description,
            isSystem: true,
            createdByUserId: params.createdByUserId ?? null,
        })
        .returning();
    return role;
};


export const assignPermissionsToRole = async (
    roleId: string,
    permissionIds: string[],
) => {
    if (permissionIds.length === 0) return;
    await db
        .insert(rolePermissions)
        .values(permissionIds.map((permissionId) => ({ roleId, permissionId })))
        .onConflictDoNothing();
};


export const assignRoleToUser = async (params: {
    organizationId: string;
    userId: string;
    roleId: string;
    assignedByUserId?: string | null;
}) => {
    await db
        .insert(userRoles)
        .values({
            organizationId: params.organizationId,
            userId: params.userId,
            roleId: params.roleId,
            assignedByUserId: params.assignedByUserId ?? null,
        })
        .onConflictDoNothing();
};


export const removeRoleFromUser = async (params: {
    organizationId: string;
    userId: string;
    roleId: string;
}) => {
    await db
        .delete(userRoles)
        .where(
            and(
                eq(userRoles.organizationId, params.organizationId),
                eq(userRoles.userId, params.userId),
                eq(userRoles.roleId, params.roleId),
            ),
        );
};