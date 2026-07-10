import { NextFunction, Request, Response } from "express";
import {
    assignRoleToUserService,
    getUserWithRolesService,
    listOrganizationRolesService,
    listOrganizationUsersService,
    removeRoleFromUserService,
} from "../services/user";
import { AuthenticationError } from "../utils/error";

// ─── List Organization Users ──────────────────────────────────────────────────

export const listOrganizationUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.auth?.organizationId) {
            return next(new AuthenticationError());
        }

        const members = await listOrganizationUsersService(
            req.auth.organizationId
        );

        return res.status(200).json({
            data: members,
            total: members.length,
        });
    } catch (error) {
        return next(error);
    }
};

// ─── Get User Roles ───────────────────────────────────────────────────────────

export const getUserRoles = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.auth?.organizationId) {
            return next(new AuthenticationError());
        }

        const userId = String(req.params.userId);

        const userWithRoles = await getUserWithRolesService(
            req.auth.organizationId,
            userId
        );

        return res.status(200).json({
            data: userWithRoles,
        });
    } catch (error) {
        return next(error);
    }
};

// ─── Assign Role To User ──────────────────────────────────────────────────────

export const assignUserRole = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.auth?.organizationId || !req.auth?.userId) {
            return next(new AuthenticationError());
        }

        const targetUserId = String(req.params.userId);
        const { roleId } = req.body;

        if (!roleId || typeof roleId !== "string") {
            return res.status(400).json({
                error: "VALIDATION_ERROR",
                message: "roleId is required",
            });
        }

        const result = await assignRoleToUserService({
            organizationId: req.auth.organizationId,
            actorUserId: req.auth.userId,
            targetUserId,
            roleId,
        });

        return res.status(200).json({
            data: result,
        });
    } catch (error) {
        return next(error);
    }
};

// ─── Remove Role From User ────────────────────────────────────────────────────

export const removeUserRole = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.auth?.organizationId || !req.auth?.userId) {
            return next(new AuthenticationError());
        }

        const targetUserId = String(req.params.userId);
        const roleId = String(req.params.roleId);

        const result = await removeRoleFromUserService({
            organizationId: req.auth.organizationId,
            actorUserId: req.auth.userId,
            targetUserId,
            roleId,
        });

        return res.status(200).json({
            data: result,
        });
    } catch (error) {
        return next(error);
    }
};

// ─── List Organization Roles ──────────────────────────────────────────────────

export const listOrganizationRoles = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.auth?.organizationId) {
            return next(new AuthenticationError());
        }

        const roles = await listOrganizationRolesService(
            req.auth.organizationId
        );

        return res.status(200).json({
            data: roles,
            total: roles.length,
        });
    } catch (error) {
        return next(error);
    }
};