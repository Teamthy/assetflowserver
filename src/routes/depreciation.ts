import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as depreciationController from "../controllers/depreciation";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";

export const depreciationRouter = Router();

depreciationRouter.use(requireAuth);

// ─── Get Depreciation Schedule ────────────────────────────────────────────────
depreciationRouter.get(
    "/schedule",
    requirePermission(PERMISSIONS.ASSET_READ),
    depreciationController.getDepreciationSchedule
);

// ─── Run Batch Depreciation ───────────────────────────────────────────────────
depreciationRouter.post(
    "/run",
    requirePermission(PERMISSIONS.DEPRECIATION_RECORD),
    depreciationController.runDepreciationBatch
);

// ─── Preview Depreciation for Asset ───────────────────────────────────────────
depreciationRouter.get(
    "/preview/:assetId",
    requirePermission(PERMISSIONS.DEPRECIATION_RECORD),
    depreciationController.previewAssetDepreciation
);