import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db";
import { organizationUsers, organizations, users } from "../model";
import { hashToken, generateToken } from "./auth";

// ─── Create Invitation ────────────────────────────────────────────────────────

export async function createInvitation(input: {
    organizationId: string;
    userId: string;
    invitedByUserId: string;
    expiresAt: Date;
}): Promise<{ inviteToken: string }> {
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    await db
        .insert(organizationUsers)
        .values({
            organizationId: input.organizationId,
            userId: input.userId,
            status: "invited",
            inviteToken: tokenHash,
            inviteExpiresAt: input.expiresAt,
            invitedByUserId: input.invitedByUserId,
        })
        .onConflictDoUpdate({
            target: [
                organizationUsers.organizationId,
                organizationUsers.userId,
            ],
            set: {
                status: "invited",
                inviteToken: tokenHash,
                inviteExpiresAt: input.expiresAt,
                invitedByUserId: input.invitedByUserId,
                updatedAt: new Date(),
            },
        });

    return { inviteToken: rawToken };
}

// ─── Find Valid Invitation ────────────────────────────────────────────────────

export async function findValidInvitation(rawToken: string): Promise<{
    organizationId: string;
    userId: string;
    organizationName: string;
    organizationSlug: string;
    userEmail: string;
    userFirstName: string;
    userLastName: string;
} | null> {
    const tokenHash = hashToken(rawToken);

    const rows = await db
        .select({
            organizationId: organizationUsers.organizationId,
            userId: organizationUsers.userId,
            organizationName: organizations.name,
            organizationSlug: organizations.slug,
            userEmail: users.email,
            userFirstName: users.firstName,
            userLastName: users.lastName,
        })
        .from(organizationUsers)
        .innerJoin(
            organizations,
            eq(organizationUsers.organizationId, organizations.id)
        )
        .innerJoin(users, eq(organizationUsers.userId, users.id))
        .where(
            and(
                eq(organizationUsers.inviteToken, tokenHash),
                eq(organizationUsers.status, "invited"),
                gt(organizationUsers.inviteExpiresAt, new Date())
            )
        )
        .limit(1);

    return rows[0] ?? null;
}

// ─── Accept Invitation ────────────────────────────────────────────────────────

export async function acceptInvitation(
    organizationId: string,
    userId: string
): Promise<void> {
    await db
        .update(organizationUsers)
        .set({
            status: "active",
            joinedAt: new Date(),
            inviteToken: null,
            inviteExpiresAt: null,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(organizationUsers.organizationId, organizationId),
                eq(organizationUsers.userId, userId)
            )
        );
}

// ─── Find Existing Membership ─────────────────────────────────────────────────

export async function findExistingMembership(
    organizationId: string,
    userId: string
): Promise<{ status: string } | null> {
    const rows = await db
        .select({ status: organizationUsers.status })
        .from(organizationUsers)
        .where(
            and(
                eq(organizationUsers.organizationId, organizationId),
                eq(organizationUsers.userId, userId)
            )
        )
        .limit(1);

    return rows[0] ?? null;
}

// ─── Get Pending Invitations For Org ─────────────────────────────────────────

export async function getPendingInvitations(organizationId: string): Promise<
    {
        userId: string;
        email: string;
        firstName: string;
        lastName: string;
        inviteExpiresAt: Date | null;
        invitedByUserId: string | null;
    }[]
> {
    const rows = await db
        .select({
            userId: organizationUsers.userId,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            inviteExpiresAt: organizationUsers.inviteExpiresAt,
            invitedByUserId: organizationUsers.invitedByUserId,
        })
        .from(organizationUsers)
        .innerJoin(users, eq(organizationUsers.userId, users.id))
        .where(
            and(
                eq(organizationUsers.organizationId, organizationId),
                eq(organizationUsers.status, "invited"),
                isNull(users.deletedAt)
            )
        );

    return rows;
}

// ─── Cancel Invitation ────────────────────────────────────────────────────────

export async function cancelInvitation(
    organizationId: string,
    userId: string
): Promise<boolean> {
    const result = await db
        .delete(organizationUsers)
        .where(
            and(
                eq(organizationUsers.organizationId, organizationId),
                eq(organizationUsers.userId, userId),
                eq(organizationUsers.status, "invited")
            )
        )
        .returning({ userId: organizationUsers.userId });

    return result.length > 0;
}