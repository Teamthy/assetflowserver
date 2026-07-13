import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";
import {
    requireBranchScope,
    requireOwnTask,
    requireNotReadOnly,
} from "../middlewares/scope";
import { PERMISSIONS } from "../config/permissions";
import * as maintenanceController from "../controllers/maintenance";

export const maintenanceRouter = Router();

maintenanceRouter.use(requireAuth);

// ─── List Maintenance Tasks ───────────────────────────────────────────────────
// Admin, Asset Manager: all tasks
// Branch Manager: own branch tasks (scope injects branchId filter)
// Maintenance Staff: own assigned tasks (requireOwnTask injects userId filter)
// Standard Staff: own assigned tasks
maintenanceRouter.get(
    "/",
    requirePermission(PERMISSIONS.MAINTENANCE_READ),
    requireBranchScope("maintenance"),
    requireOwnTask,
    maintenanceController.listMaintenance
);

// ─── Create Maintenance Task ──────────────────────────────────────────────────
// Admin, Asset Manager: any asset
// Branch Manager: assets in own branch only
// Maintenance Staff: own assigned assets only
maintenanceRouter.post(
    "/",
    requirePermission(PERMISSIONS.MAINTENANCE_CREATE),
    requireNotReadOnly,
    requireBranchScope("maintenance"),
    maintenanceController.createMaintenance
);

// ─── Get Maintenance Task By ID ───────────────────────────────────────────────
// Maintenance Staff: own tasks only
// Branch Manager: own branch only
maintenanceRouter.get(
    "/:id",
    requirePermission(PERMISSIONS.MAINTENANCE_READ),
    requireBranchScope("maintenance"),
    requireOwnTask,
    maintenanceController.getMaintenanceById
);

// ─── Update Maintenance Task ──────────────────────────────────────────────────
// Admin, Asset Manager: any task
// Branch Manager: own branch tasks
// Maintenance Staff: own assigned tasks only
maintenanceRouter.patch(
    "/:id",
    requirePermission(PERMISSIONS.MAINTENANCE_UPDATE),
    requireNotReadOnly,
    requireBranchScope("maintenance"),
    requireOwnTask,
    maintenanceController.updateMaintenance
);

// ─── Complete Maintenance Task ────────────────────────────────────────────────
// Admin, Asset Manager, Branch Manager: any task in scope
// Maintenance Staff: own assigned tasks only
maintenanceRouter.patch(
    "/:id/complete",
    requirePermission(PERMISSIONS.MAINTENANCE_COMPLETE),
    requireNotReadOnly,
    requireBranchScope("maintenance"),
    requireOwnTask,
    maintenanceController.completeMaintenance
);
