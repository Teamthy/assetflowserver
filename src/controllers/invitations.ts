import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
    acceptInvitationService,
    cancelInvitationService,
    inviteUserService,
    listPendingInvitationsService,
    previewInvitationService,
} from "../services/invitation.service";
import { AuthenticationError, ValidationError } from "../utils/error";

// ─── Invite User ──────────────────────────────────────────────────────────────

const inviteUserSchema = z.object({
    email: z.string().email("Valid email is required"),
    firstName: z.string().min(1, "First name is required").max(120),
    lastName: z.string().min(1, "Last name is required").max(120),
    roleId: z.string().uuid("Invalid role ID").optional(),
});

export const inviteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.auth?.organizationId || !req.auth?.userId) {
            return next(new AuthenticationError());
        }

        const parsed = inviteUserSchema.safeParse(req.body);
        if (!parsed.success) {
            return next(new ValidationError("Validation failed", parsed.error.issues));
        }

        const result = await inviteUserService({
            organizationId: req.auth.organizationId,
            actorUserId: req.auth.userId,
            ...parsed.data,
        });

        return res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return next(error);
    }
};

// ─── Accept Invitation ────────────────────────────────────────────────────────

const acceptInvitationSchema = z.object({
    token: z.string().min(1, "Invitation token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(1).max(120).optional(),
    lastName: z.string().min(1).max(120).optional(),
});

export const acceptInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const parsed = acceptInvitationSchema.safeParse(req.body);
        if (!parsed.success) {
            return next(new ValidationError("Validation failed", parsed.error.issues));
        }

        const result = await acceptInvitationService(parsed.data);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return next(error);
    }
};

// ─── Preview Invitation ───────────────────────────────────────────────────────

export const previewInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = String(req.params.token);

        const result = await previewInvitationService(token);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return next(error);
    }
};

// ─── List Pending Invitations ─────────────────────────────────────────────────

export const listPendingInvitations = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.auth?.organizationId) {
            return next(new AuthenticationError());
        }

        const result = await listPendingInvitationsService(
            req.auth.organizationId
        );

        return res.status(200).json({
            success: true,
            data: result,
            total: result.length,
        });
    } catch (error) {
        return next(error);
    }
};

// ─── Cancel Invitation ────────────────────────────────────────────────────────

export const cancelInvitation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.auth?.organizationId || !req.auth?.userId) {
            return next(new AuthenticationError());
        }

        const targetUserId = String(req.params.userId);

        const result = await cancelInvitationService({
            organizationId: req.auth.organizationId,
            targetUserId,
            actorUserId: req.auth.userId,
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return next(error);
    }
};