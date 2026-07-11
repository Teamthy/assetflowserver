import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as reportsController from "../controllers/reports";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

// ─── Asset Dashboard ──────────────────────────────────────────────────────────
// Who can see: admin, asset_manager, branch_manager, auditor
reportsRouter.get(
    "/assets",
    requirePermission(PERMISSIONS.ASSET_READ),
    reportsController.getAssetDashboard
);

// ─── Finance Dashboard ─────────────────────────────────────────────────────────
// Who can see: admin, finance, auditor
reportsRouter.get(
    "/finance",
    requirePermission(PERMISSIONS.ASSET_AUDIT),
    reportsController.getFinanceDashboard
);

// ─── Maintenance Dashboard ─────────────────────────────────────────────────────
// Who can see: admin, asset_manager, branch_manager, maintenance_staff
reportsRouter.get(
    "/maintenance",
    requirePermission(PERMISSIONS.MAINTENANCE_READ),
    reportsController.getMaintenanceDashboard
);

// ─── Audit Dashboard ───────────────────────────────────────────────────────────
// Who can see: admin, auditor, finance
reportsRouter.get(
    "/audit",
    requirePermission(PERMISSIONS.ASSET_AUDIT),
    reportsController.getAuditDashboard
);