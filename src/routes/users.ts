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