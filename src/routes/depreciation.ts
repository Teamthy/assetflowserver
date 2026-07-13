import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as depreciationController from "../controllers/depreciation";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";
import { requireNotReadOnly } from "../middlewares/scope";

export const depreciationRouter = Router();

depreciationRouter.use(requireAuth);

// ─── Get Depreciation Schedule ────────────────────────────────────────────────
// Admin, Asset Manager, Finance, Auditor can view schedules
depreciationRouter.get(
    "/schedule",
    requirePermission(PERMISSIONS.DEPRECIATION_RECORD),
    depreciationController.getDepreciationSchedule
);

// ─── Run Batch Depreciation ───────────────────────────────────────────────────
// Admin and Finance only — DEPRECIATION_RUN_BULK
depreciationRouter.post(
    "/run",
    requirePermission(PERMISSIONS.DEPRECIATION_RUN_BULK),
    requireNotReadOnly,
    depreciationController.runDepreciationBatch
);

// ─── Preview Depreciation for Asset ──────────────────────────────────────────
// Anyone who can record depreciation can preview
depreciationRouter.get(
    "/preview/:assetId",
    requirePermission(PERMISSIONS.DEPRECIATION_RECORD),
    depreciationController.previewAssetDepreciation
);