import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as usersController from "../controllers/user";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";
import { requireNotReadOnly } from "../middlewares/scope";

export const usersRouter = Router();

usersRouter.use(requireAuth);

// ─── List org users ───────────────────────────────────────────────────────────
usersRouter.get(
    "/",
    requirePermission(PERMISSIONS.USER_READ),
    usersController.listOrganizationUsers
);

// ─── List available roles ─────────────────────────────────────────────────────
// Must be before /:userId to avoid route conflict
usersRouter.get(
    "/roles",
    requirePermission(PERMISSIONS.ROLE_READ),
    usersController.listOrganizationRoles
);

// ─── Transfer organization ownership ──────────────────────────────────────────
// Must be before /:userId to avoid route conflict
usersRouter.post(
    "/transfer-ownership",
    requirePermission(PERMISSIONS.ORG_OWNERSHIP_TRANSFER),
    requireNotReadOnly,
    usersController.transferOwnership
);

// ─── Get user roles ───────────────────────────────────────────────────────────
usersRouter.get(
    "/:userId/roles",
    requirePermission(PERMISSIONS.ROLE_READ),
    usersController.getUserRoles
);

// ─── Assign role to user ──────────────────────────────────────────────────────
usersRouter.post(
    "/:userId/roles",
    requirePermission(PERMISSIONS.ROLE_ASSIGN),
    requireNotReadOnly,
    usersController.assignUserRole
);

// ─── Remove role from user ────────────────────────────────────────────────────
usersRouter.delete(
    "/:userId/roles/:roleId",
    requirePermission(PERMISSIONS.ROLE_ASSIGN),
    requireNotReadOnly,
    usersController.removeUserRole
);

usersRouter.patch(
    "/:userId/role",
    requirePermission(PERMISSIONS.ROLE_ASSIGN),
    requireNotReadOnly,
    usersController.replaceUserRole
);

usersRouter.delete(
    "/:userId",
    requirePermission(PERMISSIONS.USER_REMOVE),
    requireNotReadOnly,
    usersController.removeUser
);

// ─── Suspend user ─────────────────────────────────────────────────────────────
// Admin and Org Admin only — USER_SUSPEND permission
usersRouter.patch(
    "/:userId/suspend",
    requirePermission(PERMISSIONS.USER_SUSPEND),
    requireNotReadOnly,
    usersController.suspendUser
);

// ─── Reactivate user ──────────────────────────────────────────────────────────
usersRouter.patch(
    "/:userId/reactivate",
    requirePermission(PERMISSIONS.USER_SUSPEND),
    requireNotReadOnly,
    usersController.reactivateUser
);