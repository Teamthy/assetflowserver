import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import {
    organizationUsers,
    roles,
    userRoles,
    users,
} from "../model";

/**
 * Get all active members of an organization
 * with their basic profile info and membership status.
 */
export async function getOrganizationMembers(organizationId: string): Promise<
    {
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
        status: string;
        joinedAt: Date | null;
        roles: Array<{ id: string; name: string }>;
    }[]
> {
    const rows = await db
        .select({
            userId: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            status: organizationUsers.status,
            joinedAt: organizationUsers.joinedAt,
        })
        .from(organizationUsers)
        .innerJoin(users, eq(organizationUsers.userId, users.id))
        .where(
            and(
                eq(organizationUsers.organizationId, organizationId),
                isNull(users.deletedAt)
            )
        );

    if (rows.length === 0) return [];

    const roleRows = await db
        .select({
            userId: userRoles.userId,
            roleId: roles.id,
            name: roles.name,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
            and(
                eq(userRoles.organizationId, organizationId),
                inArray(userRoles.userId, rows.map((row) => row.userId)),
                isNull(roles.deletedAt)
            )
        );

    const rolesByUser = new Map<string, Array<{ id: string; name: string }>>();
    for (const role of roleRows) {
        const current = rolesByUser.get(role.userId) ?? [];
        current.push({ id: role.roleId, name: role.name });
        rolesByUser.set(role.userId, current);
    }

    return rows.map((row) => ({
        ...row,
        roles: rolesByUser.get(row.userId) ?? [],
    }));
}

/**
 * Get a single organization member by userId.
 * Returns null if user is not a member.
 */
export async function getOrganizationMember(
    organizationId: string,
    userId: string
): Promise<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    joinedAt: Date | null;
} | null> {
    const rows = await db
        .select({
            userId: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            status: organizationUsers.status,
            joinedAt: organizationUsers.joinedAt,
        })
        .from(organizationUsers)
        .innerJoin(users, eq(organizationUsers.userId, users.id))
        .where(
            and(
                eq(organizationUsers.organizationId, organizationId),
                eq(organizationUsers.userId, userId),
                isNull(users.deletedAt)
            )
        );

    return rows[0] ?? null;
}