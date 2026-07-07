import { Router } from "express";
import * as assetsController from "../controllers/assets";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/authorize";
import { PERMISSIONS } from "../types/roles";

export const assetsRouter = Router();

assetsRouter.use(requireAuth); // all asset routes require auth

assetsRouter.get(
  "/",
  requirePermission(PERMISSIONS.ASSET_READ),
  assetsController.listAssets,
);
assetsRouter.get(
  "/export",
  requirePermission(PERMISSIONS.ASSET_EXPORT),
  assetsController.exportAssets,
);
assetsRouter.post(
  "/import",
  requirePermission(PERMISSIONS.ASSET_IMPORT),
  assetsController.importAssets,
);
assetsRouter.get(
  "/audit",
  requirePermission(PERMISSIONS.AUDIT_READ),
  assetsController.getAssetsAudit,
);
assetsRouter.post(
  "/",
  requirePermission(PERMISSIONS.ASSET_CREATE),
  assetsController.createAsset,
);
assetsRouter.get(
  "/:id",
  requirePermission(PERMISSIONS.ASSET_READ),
  assetsController.getAssetById,
);
assetsRouter.patch(
  "/:id",
  requirePermission(PERMISSIONS.ASSET_UPDATE),
  assetsController.updateAsset,
);
assetsRouter.delete(
  "/:id",
  requirePermission(PERMISSIONS.ASSET_DELETE),
  assetsController.deleteAsset,
);
assetsRouter.post(
  "/:id/transfer",
  requirePermission(PERMISSIONS.ASSET_TRANSFER),
  assetsController.transferAsset,
);
assetsRouter.post(
  "/:id/dispose",
  requirePermission(PERMISSIONS.ASSET_DISPOSE),
  assetsController.disposeAsset,
);
assetsRouter.post(
  "/:id/restore",
  requirePermission(PERMISSIONS.ASSET_RESTORE),
  assetsController.restoreAsset,
);
assetsRouter.post(
  "/:id/depreciation",
  requirePermission(PERMISSIONS.FINANCE_DEPRECIATION_CREATE),
  assetsController.recordAssetDepreciation,
);
assetsRouter.get(
  "/:id/timeline",
  requirePermission(PERMISSIONS.AUDIT_READ),
  assetsController.getAssetTimeline,
);