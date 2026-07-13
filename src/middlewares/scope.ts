import { NextFunction, Request, Response } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import {
    assets,
    maintenanceTasks,
    organizations,
} from "../model";
import {
    BRANCH_SCOPED_ROLES,
    ASSIGNMENT_SCOPED_ROLES,
    READ_ONLY_ROLES,
    SystemRoleName,
} from "../config/permissions";
import { getUserRoles } from "../repositories/permissions";
import { AuthenticationError, AuthorizationError } from "../utils/error";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Get actor role names, cached per request
// ─────────────────────────────────────────────────────────────────────────────

async function getActorRoles(req: Request): Promise<SystemRoleName[]> {
    if ((req as any)._actorRoles) {
        return (req as any)._actorRoles;
    }
    const { userId, organizationId } = req.auth!;
    const rows = await getUserRoles(userId, organizationId);
    const roleNames = rows.map((r) => r.name as SystemRoleName);
    (req as any)._actorRoles = roleNames;
    return roleNames;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Resolve target resource branch ID
// ─────────────────────────────────────────────────────────────────────────────

export type ScopeResourceType = "asset" | "branch" | "maintenance";

async function resolveTargetBranchId(
    req: Request,
    resourceType: ScopeResourceType,
    organizationId: string
): Promise<string | null> {
    const resourceId = req.params.id as string; // ← cast fixes TS2769

    if (!resourceId) return null;

    switch (resourceType) {
        case "asset": {
            const rows = await db
                .select({ branchId: assets.branchId })
                .from(assets)
                .where(
                    and(
                        eq(assets.id, resourceId),
                        eq(assets.organizationId, organizationId),
                        isNull(assets.deletedAt)
                    )
                );
            return rows[0]?.branchId ?? null;
        }

        case "branch": {
            return resourceId; // ← now string, not string | string[]
        }

        case "maintenance": {
            const rows = await db
                .select({ branchId: assets.branchId })
                .from(maintenanceTasks)
                .innerJoin(assets, eq(maintenanceTasks.assetId, assets.id))
                .where(
                    and(
                        eq(maintenanceTasks.id, resourceId),
                        eq(maintenanceTasks.organizationId, organizationId)
                    )
                );
            return rows[0]?.branchId ?? null;
        }

        default:
            return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE 1 — requireBranchScope
// ─────────────────────────────────────────────────────────────────────────────

export const requireBranchScope = (resourceType: ScopeResourceType) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            if (!req.auth?.userId || !req.auth?.organizationId) {
                return next(new AuthenticationError("Authentication required"));
            }

            const actorRoles = await getActorRoles(req);

            const isBranchScoped = actorRoles.some((r) =>
                BRANCH_SCOPED_ROLES.has(r)
            );

            if (!isBranchScoped) {
                return next();
            }

            const actorBranchId = req.auth.branchId;

            if (!actorBranchId) {
                return next(
                    new AuthorizationError(
                        "Branch Manager must be assigned to a branch to perform this action"
                    )
                );
            }

            const resourceId = req.params.id as string; // ← cast

            if (!resourceId) {
                req.auth.scopedBranchId = actorBranchId;
                return next();
            }

            const targetBranchId = await resolveTargetBranchId(
                req,
                resourceType,
                req.auth.organizationId
            );

            if (targetBranchId === null) {
                return next();
            }

            if (targetBranchId !== actorBranchId) {
                return next(
                    new AuthorizationError(
                        "You can only perform this action for resources in your assigned branch"
                    )
                );
            }

            req.auth.scopedBranchId = actorBranchId;
            return next();

        } catch (error) {
            return next(error);
        }
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE 2 — requireOwnAsset
// ─────────────────────────────────────────────────────────────────────────────

export const requireOwnAsset = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.auth?.userId || !req.auth?.organizationId) {
            return next(new AuthenticationError("Authentication required"));
        }

        const actorRoles = await getActorRoles(req);

        const isAssignmentScoped = actorRoles.some((r) =>
            ASSIGNMENT_SCOPED_ROLES.has(r)
        );

        if (!isAssignmentScoped) {
            return next();
        }

        const resourceId = req.params.id as string; // ← cast

        if (!resourceId) {
            req.auth.scopedUserId = req.auth.userId;
            return next();
        }

        const { userId, organizationId } = req.auth;

        const rows = await db
            .select({ assignedTo: assets.assignedTo })
            .from(assets)
            .where(
                and(
                    eq(assets.id, resourceId),
                    eq(assets.organizationId, organizationId),
                    isNull(assets.deletedAt)
                )
            );

        if (rows.length === 0) {
            return next(
                new AuthorizationError("Asset not found or not accessible")
            );
        }

        if (rows[0].assignedTo !== userId) {
            return next(
                new AuthorizationError(
                    "You can only access assets assigned to you"
                )
            );
        }

        return next();

    } catch (error) {
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE 3 — requireOwnTask
// ─────────────────────────────────────────────────────────────────────────────

export const requireOwnTask = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.auth?.userId || !req.auth?.organizationId) {
            return next(new AuthenticationError("Authentication required"));
        }

        const actorRoles = await getActorRoles(req);

        const isMaintenanceStaff = actorRoles.some(
            (r) => r === "maintenance_staff"
        );

        if (!isMaintenanceStaff) {
            return next();
        }

        const resourceId = req.params.id as string; // ← cast

        if (!resourceId) {
            req.auth.scopedUserId = req.auth.userId;
            return next();
        }

        const { userId, organizationId } = req.auth;

        const rows = await db
            .select({ assignedTo: maintenanceTasks.assignedTo })
            .from(maintenanceTasks)
            .where(
                and(
                    eq(maintenanceTasks.id, resourceId),
                    eq(maintenanceTasks.organizationId, organizationId),
                    isNull(maintenanceTasks.deletedAt)
                )
            );

        if (rows.length === 0) {
            return next(
                new AuthorizationError(
                    "You can only access maintenance tasks assigned to you"
                )
            );
        }

        if (rows[0].assignedTo !== userId) {
            return next(
                new AuthorizationError(
                    "You can only access maintenance tasks assigned to you"
                )
            );
        }

        return next();

    } catch (error) {
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE 4 — requireNotReadOnly
// ─────────────────────────────────────────────────────────────────────────────

export const requireNotReadOnly = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.auth?.userId || !req.auth?.organizationId) {
            return next(new AuthenticationError("Authentication required"));
        }

        const actorRoles = await getActorRoles(req);

        const isReadOnly = actorRoles.every((r) => READ_ONLY_ROLES.has(r));

        if (isReadOnly) {
            return next(
                new AuthorizationError(
                    "Your role does not permit write operations"
                )
            );
        }

        return next();

    } catch (error) {
        return next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE 5 — requirePrimaryAdmin
// ─────────────────────────────────────────────────────────────────────────────

export const requirePrimaryAdmin = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.auth?.userId || !req.auth?.organizationId) {
            return next(new AuthenticationError("Authentication required"));
        }

        const { userId, organizationId } = req.auth;

        const rows = await db
            .select({ ownerUserId: organizations.ownerUserId })
            .from(organizations)
            .where(
                and(
                    eq(organizations.id, organizationId),
                    isNull(organizations.deletedAt)
                )
            );

        const isPrimary = rows[0]?.ownerUserId === userId;

        if (!isPrimary) {
            return next(
                new AuthorizationError(
                    "Only the Primary Admin can perform this action"
                )
            );
        }

        return next();

    } catch (error) {
        return next(error);
    }
};