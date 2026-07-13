import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as reportsController from "../controllers/reports";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";
import { requireBranchScope } from "../middlewares/scope";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

// ─── Asset Dashboard ──────────────────────────────────────────────────────────
// Admin, Asset Manager, Branch Manager (own branch), Finance, Auditor
// Branch Manager sees their branch scoped data — controller reads scopedBranchId
reportsRouter.get(
    "/assets",
    requirePermission(PERMISSIONS.REPORT_VIEW),
    requireBranchScope("asset"),
    reportsController.getAssetDashboard
);

// ─── Finance Dashboard ────────────────────────────────────────────────────────
// Admin, Asset Manager, Finance, Auditor only
// No branch scoping — finance data is org-wide
reportsRouter.get(
    "/finance",
    requirePermission(PERMISSIONS.REPORT_VIEW),
    reportsController.getFinanceDashboard
);

// ─── Maintenance Dashboard ────────────────────────────────────────────────────
// Admin, Asset Manager, Branch Manager (own branch), Auditor
// Maintenance Staff sees own tasks — scopedUserId injected
reportsRouter.get(
    "/maintenance",
    requirePermission(PERMISSIONS.REPORT_VIEW),
    requireBranchScope("maintenance"),
    reportsController.getMaintenanceDashboard
);

// ─── Audit Dashboard ──────────────────────────────────────────────────────────
// Admin, Asset Manager, Finance, Auditor, Branch Manager (own branch)
reportsRouter.get(
    "/audit",
    requirePermission(PERMISSIONS.REPORT_VIEW),
    requireBranchScope("asset"),
    reportsController.getAuditDashboard
);