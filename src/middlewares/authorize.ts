import { NextFunction, Request, Response } from "express";
import { getUserPermissions } from "../services/roles.service";
import { AuthenticationError, AuthorizationError } from "../utils/error";
import { PermissionKey } from "../types/roles";


export const requirePermission =
    (permission: PermissionKey) =>
        async (req: Request, _res: Response, next: NextFunction) => {
            try {
                if (!req.auth?.userId || !req.auth?.organizationId) {
                    return next(new AuthenticationError("Authentication required"));
                }

                const permissions = await getUserPermissions(
                    req.auth.userId,
                    req.auth.organizationId,
                );

                if (!permissions.has(permission)) {
                    return next(
                        new AuthorizationError(
                            `Missing required permission: ${permission}`,
                        ),
                    );
                }

                return next();
            } catch (error) {
                return next(error);
            }
        };


export const requireAnyPermission =
    (allowed: PermissionKey[]) =>
        async (req: Request, _res: Response, next: NextFunction) => {
            try {
                if (!req.auth?.userId || !req.auth?.organizationId) {
                    return next(new AuthenticationError("Authentication required"));
                }

                const permissions = await getUserPermissions(
                    req.auth.userId,
                    req.auth.organizationId,
                );

                const hasAny = allowed.some((permission) => permissions.has(permission));
                if (!hasAny) {
                    return next(
                        new AuthorizationError(
                            `Missing required permission. One of: ${allowed.join(", ")}`,
                        ),
                    );
                }

                return next();
            } catch (error) {
                return next(error);
            }
        };


export const requireAllPermissions =
    (required: PermissionKey[]) =>
        async (req: Request, _res: Response, next: NextFunction) => {
            try {
                if (!req.auth?.userId || !req.auth?.organizationId) {
                    return next(new AuthenticationError("Authentication required"));
                }

                const permissions = await getUserPermissions(
                    req.auth.userId,
                    req.auth.organizationId,
                );

                const missing = required.filter((permission) => !permissions.has(permission));
                if (missing.length > 0) {
                    return next(
                        new AuthorizationError(
                            `Missing required permission(s): ${missing.join(", ")}`,
                        ),
                    );
                }

                return next();
            } catch (error) {
                return next(error);
            }
        };