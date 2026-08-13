import { NextFunction, Request, Response } from "express";
import { isRbacEnforced } from "../config/access";
import { PermissionKey } from "../config/permissions";
import { AuthenticationError, AuthorizationError } from "../utils/error";
import { userHasAllPermissions, userHasPermission } from "../repositories/permissions";

/**
 * requirePermission
 * 
 * Middleware factory that checks if the authenticated user
 * has the required permission within their organization.
 * 
 * Usage:
 *   router.post("/", requireAuth, requirePermission(PERMISSIONS.ASSET_CREATE), controller)
 * 
 * Must be used AFTER requireAuth middleware.
 */
export const requirePermission = (permissionKey: PermissionKey) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            // requireAuth must run first
            if (!req.auth?.userId || !req.auth?.organizationId) {
                return next(new AuthenticationError("Authentication required"));
            }

            // Present deployment: every authenticated member has full access.
            if (!isRbacEnforced()) {
                return next();
            }

            const { userId, organizationId } = req.auth;

            const hasPermission = await userHasPermission(
                userId,
                organizationId,
                permissionKey
            );

            if (!hasPermission) {
                return next(
                    new AuthorizationError(
                        `You do not have permission to perform this action`
                    )
                );
            }

            return next();
        } catch (error) {
            return next(error);
        }
    };
};

/**
 * requireAllPermissions
 * 
 * Middleware factory that checks if the authenticated user
 * has ALL of the required permissions.
 * 
 * Usage:
 *   router.post("/", requireAuth, requireAllPermissions([
 *     PERMISSIONS.ASSET_CREATE,
 *     PERMISSIONS.BRANCH_READ
 *   ]), controller)
 */
export const requireAllPermissions = (permissionKeys: PermissionKey[]) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            if (!req.auth?.userId || !req.auth?.organizationId) {
                return next(new AuthenticationError("Authentication required"));
            }

            if (!isRbacEnforced()) {
                return next();
            }

            const { userId, organizationId } = req.auth;

            const hasAll = await userHasAllPermissions(
                userId,
                organizationId,
                permissionKeys
            );

            if (!hasAll) {
                return next(
                    new AuthorizationError(
                        `You do not have the required permissions to perform this action`
                    )
                );
            }

            return next();
        } catch (error) {
            return next(error);
        }
    };
};


export const requireAnyPermission = (permissionKeys: PermissionKey[]) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            if (!req.auth?.userId || !req.auth?.organizationId) {
                return next(new AuthenticationError("Authentication required"));
            }

            if (!isRbacEnforced()) {
                return next();
            }

            const { userId, organizationId } = req.auth;
            const results = await Promise.all(
                permissionKeys.map((key) =>
                    userHasPermission(userId, organizationId, key)
                )
            );

            const hasAny = results.some(Boolean);

            if (!hasAny) {
                return next(
                    new AuthorizationError(
                        `You do not have permission to perform this action`
                    )
                );
            }

            return next();
        } catch (error) {
            return next(error);
        }
    };
};