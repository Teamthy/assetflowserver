// ─────────────────────────────────────────────────────────────────────────────
// ASSETFLOW SCOPE MIDDLEWARE
// Version: 1.1 — Corrected for actual schema
//
// Schema corrections applied:
//   - organizationMemberships → organizationUsers (actual table name)
//   - branchId does not exist on organizationUsers
//     Branch Manager scope is resolved differently:
//     We look at assets the Branch Manager manages, not a membership field.
//     The actor's branch is passed in the JWT or resolved from their asset ownership.
//
// Branch Manager scope strategy (revised):
//   Since there is no branchId on organizationUsers, we enforce branch scope
//   by reading branchId from the REQUEST BODY or QUERY on write/list routes,
//   and by reading the target resource's branchId on resource-specific routes.
//   Branch Managers must supply their branchId — the controller validates it
//   matches what they are authorised for.
//
//   For a proper branch-locked experience, branchId should be added to:
//     - organizationUsers table (recommended — one migration)
//     - OR the JWT payload at login time
//
// isPrimaryAdmin strategy (revised):
//   organizations.ownerUserId is the Primary Admin identifier.
//   We use that instead of a membership flag.
// ─────────────────────────────────────────────────────────────────────────────

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
    const resourceId = req.params.id;

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
            // The resource ID is the branch ID itself
            return resourceId;
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
//
// REVISED STRATEGY (no branchId on organizationUsers):
//
// Branch Managers must include their branchId in the JWT payload.
// At login, the auth service should embed branchId into the token
// if the user has the branch_manager role.
//
// Until that is implemented, Branch Managers pass their branchId
// in req.auth.branchId (from JWT). We compare that against the
// target resource's branchId.
//
// If req.auth.branchId is not present and the user is a Branch Manager,
// we block the request — they must have a branch assigned.
//
// SCHEMA MIGRATION RECOMMENDED:
//   ALTER TABLE organization_users ADD COLUMN branch_id UUID REFERENCES branches(id);
//   Add branchId to JWT payload at login for branch_manager role.
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

            // Non-branch-scoped roles pass through freely
            if (!isBranchScoped) {
                return next();
            }

            // Branch Manager must have branchId in their JWT
            const actorBranchId = req.auth.branchId;

            if (!actorBranchId) {
                return next(
                    new AuthorizationError(
                        "Branch Manager must be assigned to a branch to perform this action"
                    )
                );
            }

            // For list/create routes — inject scope, no target resource yet
            const resourceId = req.params.id;
            if (!resourceId) {
                req.auth.scopedBranchId = actorBranchId;
                return next();
            }

            // For resource-specific routes — verify target is in actor's branch
            const targetBranchId = await resolveTargetBranchId(
                req,
                resourceType,
                req.auth.organizationId
            );

            if (targetBranchId === null) {
                // Resource not found — let controller handle 404
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

        const resourceId = req.params.id;

        // List routes — inject filter for controller
        if (!resourceId) {
            req.auth.scopedUserId = req.auth.userId;
            return next();
        }

        const { userId, organizationId } = req.auth;

        const rows = await db
            .select({ assignedTo: assets.assignedTo })   // ✅ correct field name
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

        if (rows[0].assignedTo !== userId) {             // ✅ correct field name
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

        const resourceId = req.params.id;

        if (!resourceId) {
            req.auth.scopedUserId = req.auth.userId;
            return next();
        }

        const { userId, organizationId } = req.auth;

        const rows = await db
            .select({ assignedTo: maintenanceTasks.assignedTo })  // ✅ correct field name
            .from(maintenanceTasks)
            .where(
                and(
                    eq(maintenanceTasks.id, resourceId),
                    eq(maintenanceTasks.organizationId, organizationId),
                    isNull(maintenanceTasks.deletedAt)              // ✅ added deletedAt check
                )
            );

        // Task not found — return 403, do not leak existence
        if (rows.length === 0) {
            return next(
                new AuthorizationError(
                    "You can only access maintenance tasks assigned to you"
                )
            );
        }

        if (rows[0].assignedTo !== userId) {                       // ✅ correct field name
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
//
// REVISED: Uses organizations.ownerUserId instead of a membership flag
// since isPrimaryAdmin does not exist on organizationUsers.
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