import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, organizations } from "../model";
import {
    acceptInvitation,
    cancelInvitation,
    createInvitation,
    findExistingMembership,
    findValidInvitation,
    getPendingInvitations,
} from "../repositories/invitations";
import { findUserByEmail } from "../repositories/auth";
import { getRoleByName, assignRoleToUser, getUserRoles } from "../repositories/permissions";
import { issueAuthSession } from "./auth-session";
import { pickPrimaryRole } from "./auth-session";
import { sendInvitationEmail } from "./email";
import { createInAppNotification } from "./notifications";
import {
    ConflictError,
    NotFoundError,
    ValidationError,
    AuthenticationError,
} from "../utils/error";
import { logger } from "../utils/logger";
import { env } from "../config/env";

// Invite expiry: 48 hours
const INVITE_EXPIRY_HOURS = 48;

// ─── Send Invitation ──────────────────────────────────────────────────────────

const SYSTEM_ROLE_ALIASES: Record<string, string> = {
    admin: "admin",
    primary_admin: "admin",
    org_admin: "admin",
    asset_manager: "asset_manager",
    finance: "finance",
    finance_user: "finance",
    auditor: "auditor",
    branch_manager: "branch_manager",
    maintenance_staff: "maintenance_staff",
    standard_staff: "standard_staff",
};

function nameFromEmail(email: string) {
    const local = email.split("@")[0] ?? "member";
    const parts = local.split(/[._-]+/).filter(Boolean);
    const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "Team";
    const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "Member";
    return { firstName, lastName };
}

export async function inviteUserService(input: {
    organizationId: string;
    actorUserId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    role?: string;
}) {
    const derivedNames = nameFromEmail(input.email);
    const { organizationId, actorUserId, email } = input;
    const firstName = input.firstName?.trim() || derivedNames.firstName;
    const lastName = input.lastName?.trim() || derivedNames.lastName;
    let roleId = input.roleId;

    // Get organization details
    const [organization] = await db
        .select({ id: organizations.id, name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

    if (!organization) {
        throw new NotFoundError("Organization");
    }

    // Get inviter details
    const [inviter] = await db
        .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
        })
        .from(users)
        .where(eq(users.id, actorUserId))
        .limit(1);

    if (!inviter) {
        throw new NotFoundError("Inviter");
    }

    // Check if user already exists
    let inviteeUser = await findUserByEmail(email);

    if (inviteeUser) {
        // Check if already a member
        const existingMembership = await findExistingMembership(
            organizationId,
            inviteeUser.id
        );

        if (existingMembership?.status === "active") {
            throw new ConflictError("User is already an active member of this organization");
        }

        if (existingMembership?.status === "suspended") {
            throw new ConflictError("User account is suspended in this organization");
        }
        // If invited before — we'll re-invite (update token below)
    } else {
        // Create a placeholder user account
        // They'll set their password on acceptance
        const placeholderHash = await bcrypt.hash(
            `invite-${Date.now()}-${Math.random()}`,
            12
        );

        const [newUser] = await db
            .insert(users)
            .values({
                firstName,
                lastName,
                email: email.toLowerCase(),
                passwordHash: placeholderHash,
                isActive: false, // Not active until they accept
            })
            .returning();

        inviteeUser = newUser;
    }

    // Create the invitation
    const expiresAt = new Date(
        Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000
    );

    const { inviteToken } = await createInvitation({
        organizationId,
        userId: inviteeUser.id,
        invitedByUserId: actorUserId,
        expiresAt,
    });

    if (!roleId && input.role) {
        const canonical = SYSTEM_ROLE_ALIASES[input.role] ?? input.role;
        const namedRole = await getRoleByName(organizationId, canonical);
        if (namedRole) roleId = namedRole.id;
    }

    // Assign role if provided
    if (roleId) {
        try {
            await assignRoleToUser(
                organizationId,
                inviteeUser.id,
                roleId,
                actorUserId
            );
        } catch (error) {
            logger.warn("[InvitationService] Failed to assign role during invite", {
                userId: inviteeUser.id,
                roleId,
                error,
            });
        }
    }

    // Build accept URL
    const acceptUrl = `${env.FRONTEND_URL}/accept-invite/${inviteToken}`;

    // Send invitation email (non-blocking)
    setImmediate(() => {
        void sendInvitationEmail({
            to: email,
            inviteeName: `${firstName} ${lastName}`.trim(),
            inviterName: `${inviter.firstName} ${inviter.lastName}`.trim(),
            organizationName: organization.name,
            acceptUrl,
            expiryHours: INVITE_EXPIRY_HOURS,
        }).catch((error) => {
            logger.error("[InvitationService] Failed to send invitation email", {
                to: email,
                organizationId,
                error: error instanceof Error ? error.message : String(error),
            });
        });
    });

    // In-app notification to inviter
    await createInAppNotification({
        organizationId,
        userId: actorUserId,
        type: "organization_invite",
        title: "Invitation sent",
        message: `An invitation has been sent to ${email}.`,
        metadata: {
            inviteeEmail: email,
            inviteeUserId: inviteeUser.id,
            redirectUrl: "/users",
        },
    });

    logger.info("[InvitationService] Invitation sent", {
        organizationId,
        inviteeEmail: email,
        inviteeUserId: inviteeUser.id,
        actorUserId,
        expiresAt: expiresAt.toISOString(),
    });

    return {
        message: "Invitation sent successfully",
        inviteeUserId: inviteeUser.id,
        email,
        expiresAt,
    };
}

// ─── Accept Invitation ────────────────────────────────────────────────────────

export async function acceptInvitationService(input: {
    token: string;
    password: string;
    firstName?: string;
    lastName?: string;
}) {
    const { token, password, firstName, lastName } = input;

    // Find and validate the invitation
    const invitation = await findValidInvitation(token);
    if (!invitation) {
        throw new AuthenticationError("Invalid or expired invitation token");
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user: set real password + activate
    const updatePayload: Record<string, unknown> = {
        passwordHash,
        isActive: true,
        updatedAt: new Date(),
    };

    if (firstName) updatePayload.firstName = firstName;
    if (lastName) updatePayload.lastName = lastName;

    await db
        .update(users)
        .set(updatePayload)
        .where(eq(users.id, invitation.userId));

    // Activate the membership
    await acceptInvitation(invitation.organizationId, invitation.userId);

    // Assign standard_staff role if user has no roles yet
    try {
        const standardRole = await getRoleByName(
            invitation.organizationId,
            "standard_staff"
        );
        if (standardRole) {
            await assignRoleToUser(
                invitation.organizationId,
                invitation.userId,
                standardRole.id,
                invitation.userId
            );
        }
    } catch (error) {
        logger.warn(
            "[InvitationService] Failed to assign default role on acceptance",
            {
                userId: invitation.userId,
                organizationId: invitation.organizationId,
                error,
            }
        );
    }

    // Welcome notification
    await createInAppNotification({
        organizationId: invitation.organizationId,
        userId: invitation.userId,
        type: "organization_invite",
        title: "Welcome to the organization",
        message: `You have successfully joined ${invitation.organizationName}.`,
        metadata: {
            organizationName: invitation.organizationName,
            redirectUrl: "/dashboard",
        },
    });

    logger.info("[InvitationService] Invitation accepted", {
        userId: invitation.userId,
        organizationId: invitation.organizationId,
    });

    const session = await issueAuthSession(invitation.userId, invitation.organizationId);

    return {
        message: "Invitation accepted successfully",
        ...session,
    };
}

// ─── Preview Invitation ───────────────────────────────────────────────────────

export async function previewInvitationService(token: string) {
    const invitation = await findValidInvitation(token);
    if (!invitation) {
        throw new AuthenticationError("Invalid or expired invitation token");
    }

    const roleRows = await getUserRoles(invitation.userId, invitation.organizationId);

    return {
        email: invitation.userEmail,
        organizationName: invitation.organizationName,
        organizationSlug: invitation.organizationSlug,
        role: pickPrimaryRole(roleRows.map((role) => role.name)),
    };
}

export async function resendInvitationService(input: {
    organizationId: string;
    targetUserId: string;
    actorUserId: string;
}) {
    const pending = await getPendingInvitations(input.organizationId);
    const invite = pending.find((item) => item.userId === input.targetUserId);
    if (!invite) {
        throw new NotFoundError("Pending invitation");
    }

    return inviteUserService({
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        email: invite.email,
        firstName: invite.firstName,
        lastName: invite.lastName,
    });
}

// ─── List Pending Invitations ─────────────────────────────────────────────────

export async function listPendingInvitationsService(organizationId: string) {
    const pending = await getPendingInvitations(organizationId);
    return pending;
}

// ─── Cancel Invitation ────────────────────────────────────────────────────────

export async function cancelInvitationService(input: {
    organizationId: string;
    targetUserId: string;
    actorUserId: string;
}) {
    const { organizationId, targetUserId, actorUserId } = input;

    const cancelled = await cancelInvitation(organizationId, targetUserId);
    if (!cancelled) {
        throw new NotFoundError("Pending invitation");
    }

    logger.info("[InvitationService] Invitation cancelled", {
        organizationId,
        targetUserId,
        cancelledBy: actorUserId,
    });

    return { message: "Invitation cancelled successfully" };
}