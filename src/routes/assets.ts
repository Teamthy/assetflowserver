import { Router } from "express";
import multer from "multer";
import os from "node:os";
import path from "node:path";
import { env } from "../config/env";
import { PERMISSIONS } from "../config/permissions";
import * as assetsController from "../controllers/assets";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
  }),
  limits: {
    fileSize: env.ASSET_IMPORT_MAX_FILE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (extension !== ".xlsx") {
      callback(new Error("Only .xlsx asset import files are supported"));
      return;
    }
    callback(null, true);
  },
});

export const assetsRouter = Router();

// All asset routes require authentication
assetsRouter.use(requireAuth);

// ─── List & Search ────────────────────────────────────────────────────────────
assetsRouter.get(
  "/",
  requirePermission(PERMISSIONS.ASSET_READ),
  assetsController.listAssets
);

// ─── Export ───────────────────────────────────────────────────────────────────
assetsRouter.get(
  "/export",
  requirePermission(PERMISSIONS.ASSET_EXPORT),
  assetsController.exportAssets
);

// ─── Import ───────────────────────────────────────────────────────────────────
assetsRouter.post(
  "/import",
  requirePermission(PERMISSIONS.ASSET_IMPORT),
  upload.single("file"),
  assetsController.importAssets
);

// ─── Audit Summary ────────────────────────────────────────────────────────────
assetsRouter.get(
  "/audit",
  requirePermission(PERMISSIONS.ASSET_AUDIT),
  assetsController.getAssetsAudit
);

// ─── Create ───────────────────────────────────────────────────────────────────
assetsRouter.post(
  "/",
  requirePermission(PERMISSIONS.ASSET_CREATE),
  assetsController.createAsset
);

// ─── Timeline ─────────────────────────────────────────────────────────────────
assetsRouter.get(
  "/:id/timeline",
  requirePermission(PERMISSIONS.ASSET_READ),
  assetsController.getAssetTimeline
);

// ─── Dispose ──────────────────────────────────────────────────────────────────
assetsRouter.post(
  "/:id/dispose",
  requirePermission(PERMISSIONS.ASSET_DISPOSE),
  assetsController.disposeAsset
);

// ─── Restore ──────────────────────────────────────────────────────────────────
assetsRouter.post(
  "/:id/restore",
  requirePermission(PERMISSIONS.ASSET_RESTORE),
  assetsController.restoreAsset
);

// ─── Depreciation ─────────────────────────────────────────────────────────────
assetsRouter.post(
  "/:id/depreciation",
  requirePermission(PERMISSIONS.DEPRECIATION_RECORD),
  assetsController.recordAssetDepreciation
);

// ─── Transfer ─────────────────────────────────────────────────────────────────
assetsRouter.post(
  "/:id/transfer",
  requirePermission(PERMISSIONS.ASSET_TRANSFER),
  assetsController.transferAsset
);

// ─── Get by ID ────────────────────────────────────────────────────────────────
assetsRouter.get(
  "/:id",
  requirePermission(PERMISSIONS.ASSET_READ),
  assetsController.getAssetById
);

// ─── Update ───────────────────────────────────────────────────────────────────
assetsRouter.patch(
  "/:id",
  requirePermission(PERMISSIONS.ASSET_UPDATE),
  assetsController.updateAsset
);

// ─── Delete ───────────────────────────────────────────────────────────────────
assetsRouter.delete(
  "/:id",
  requirePermission(PERMISSIONS.ASSET_DELETE),
  assetsController.deleteAsset
);