import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import {
    organizationUsers,
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

    return rows;
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