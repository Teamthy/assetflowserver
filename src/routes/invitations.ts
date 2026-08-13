import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as invitationsController from "../controllers/invitations";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";

export const invitationsRouter = Router();

// ─── Public Routes (no auth required) ────────────────────────────────────────

// Preview invitation details before accepting
invitationsRouter.get(
    "/preview/:token",
    invitationsController.previewInvitation
);

// Accept an invitation (sets password + activates account)
invitationsRouter.post(
    "/accept",
    invitationsController.acceptInvitation
);

// ─── Protected Routes ─────────────────────────────────────────────────────────

// Invite a new user
invitationsRouter.post(
    "/",
    requireAuth,
    requirePermission(PERMISSIONS.USER_INVITE),
    invitationsController.inviteUser
);

// List all pending invitations for the organization
invitationsRouter.get(
    "/",
    requireAuth,
    requirePermission(PERMISSIONS.USER_READ),
    invitationsController.listPendingInvitations
);

invitationsRouter.post(
    "/:userId/resend",
    requireAuth,
    requirePermission(PERMISSIONS.USER_INVITE),
    invitationsController.resendInvitation
);

// Cancel a pending invitation
invitationsRouter.delete(
    "/:userId",
    requireAuth,
    requirePermission(PERMISSIONS.USER_INVITE),
    invitationsController.cancelInvitation
);