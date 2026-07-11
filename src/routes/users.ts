import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as usersController from "../controllers/user";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";

export const usersRouter = Router();

usersRouter.use(requireAuth);

// ─── List org users ───────────────────────────────────────────────────────────
usersRouter.get(
    "/",
    requirePermission(PERMISSIONS.USER_READ),
    usersController.listOrganizationUsers
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
    usersController.assignUserRole
);

// ─── Remove role from user ────────────────────────────────────────────────────
usersRouter.delete(
    "/:userId/roles/:roleId",
    requirePermission(PERMISSIONS.ROLE_ASSIGN),
    usersController.removeUserRole
);

// ─── List available roles ─────────────────────────────────────────────────────
usersRouter.get(
    "/roles",
    requirePermission(PERMISSIONS.ROLE_READ),
    usersController.listOrganizationRoles
);