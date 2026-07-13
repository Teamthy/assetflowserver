import { Router } from "express";
import multer from "multer";
import os from "node:os";
import path from "node:path";
import { env } from "../config/env";
import { PERMISSIONS } from "../config/permissions";
import * as assetsController from "../controllers/assets";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";
import {
    requireBranchScope,
    requireOwnAsset,
    requireNotReadOnly,
} from "../middlewares/scope";

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

assetsRouter.use(requireAuth);

// ─── List & Search ────────────────────────────────────────────────────────────
// Branch Manager: own branch only (scopedBranchId injected)
// Maintenance Staff / Standard Staff: own assigned only (scopedUserId injected)
assetsRouter.get(
    "/",
    requirePermission(PERMISSIONS.ASSET_READ),
    requireBranchScope("asset"),
    requireOwnAsset,
    assetsController.listAssets
);

// ─── Export ───────────────────────────────────────────────────────────────────
// Branch Manager: own branch only
assetsRouter.get(
    "/export",
    requirePermission(PERMISSIONS.ASSET_EXPORT),
    requireBranchScope("asset"),
    assetsController.exportAssets
);

// ─── Import Template Download ─────────────────────────────────────────────────
// Admin and Asset Manager only (no Branch Manager)
assetsRouter.get(
    "/import/template",
    requirePermission(PERMISSIONS.ASSET_IMPORT),
    assetsController.downloadImportTemplate
);

// ─── Import ───────────────────────────────────────────────────────────────────
// Admin and Asset Manager only
assetsRouter.post(
    "/import",
    requirePermission(PERMISSIONS.ASSET_IMPORT),
    upload.single("file"),
    assetsController.importAssets
);

// ─── Audit Summary ────────────────────────────────────────────────────────────
// Branch Manager: own branch only
assetsRouter.get(
    "/audit",
    requirePermission(PERMISSIONS.ASSET_AUDIT),
    requireBranchScope("asset"),
    assetsController.getAssetsAudit
);

// ─── Bulk QR Generation ───────────────────────────────────────────────────────
assetsRouter.post(
    "/qr/bulk",
    requirePermission(PERMISSIONS.ASSET_READ),
    requireBranchScope("asset"),
    assetsController.generateBulkQrCodesController
);

// ─── Create Asset ─────────────────────────────────────────────────────────────
// Branch Manager: own branch only — controller reads scopedBranchId
assetsRouter.post(
    "/",
    requirePermission(PERMISSIONS.ASSET_CREATE),
    requireNotReadOnly,
    requireBranchScope("asset"),
    assetsController.createAsset
);

// ─── Asset Timeline ───────────────────────────────────────────────────────────
// Branch Manager: own branch only
assetsRouter.get(
    "/:id/timeline",
    requirePermission(PERMISSIONS.ASSET_READ),
    requireBranchScope("asset"),
    requireOwnAsset,
    assetsController.getAssetTimeline
);

// ─── Generate QR Code ─────────────────────────────────────────────────────────
assetsRouter.get(
    "/:id/qr",
    requirePermission(PERMISSIONS.ASSET_READ),
    requireBranchScope("asset"),
    assetsController.generateQrCode
);

// ─── Scan Asset (QR) ──────────────────────────────────────────────────────────
// All roles with ASSET_READ can scan — no extra scope needed
assetsRouter.get(
    "/:id/scan",
    requirePermission(PERMISSIONS.ASSET_READ),
    assetsController.scanAsset
);

// ─── Dispose Asset ────────────────────────────────────────────────────────────
// Asset Manager: auto-approved below threshold
// Finance/Admin: approve above threshold (ASSET_DISPOSE_APPROVE checked in controller)
// Branch Manager: cannot dispose
assetsRouter.post(
    "/:id/dispose",
    requirePermission(PERMISSIONS.ASSET_DISPOSE),
    requireNotReadOnly,
    assetsController.disposeAsset
);

// ─── Restore Asset ────────────────────────────────────────────────────────────
// Admin and Asset Manager only
assetsRouter.post(
    "/:id/restore",
    requirePermission(PERMISSIONS.ASSET_RESTORE),
    requireNotReadOnly,
    assetsController.restoreAsset
);

// ─── Record Depreciation ──────────────────────────────────────────────────────
// Admin, Asset Manager, Finance only
assetsRouter.post(
    "/:id/depreciation",
    requirePermission(PERMISSIONS.DEPRECIATION_RECORD),
    requireNotReadOnly,
    assetsController.recordAssetDepreciation
);

// ─── Transfer Asset ───────────────────────────────────────────────────────────
// Branch Manager: from own branch only (scope enforced)
assetsRouter.post(
    "/:id/transfer",
    requirePermission(PERMISSIONS.ASSET_TRANSFER),
    requireNotReadOnly,
    requireBranchScope("asset"),
    assetsController.transferAsset
);

// ─── Get Asset By ID ──────────────────────────────────────────────────────────
// Branch Manager: own branch only
// Maintenance Staff / Standard Staff: own assigned only
assetsRouter.get(
    "/:id",
    requirePermission(PERMISSIONS.ASSET_READ),
    requireBranchScope("asset"),
    requireOwnAsset,
    assetsController.getAssetById
);

// ─── Update Asset ─────────────────────────────────────────────────────────────
// Branch Manager: own branch, core fields only (financial fields blocked in controller)
assetsRouter.patch(
    "/:id",
    requirePermission(PERMISSIONS.ASSET_UPDATE),
    requireNotReadOnly,
    requireBranchScope("asset"),
    assetsController.updateAsset
);

// ─── Delete Asset ─────────────────────────────────────────────────────────────
// Admin and Asset Manager only — Branch Manager lacks ASSET_DELETE
assetsRouter.delete(
    "/:id",
    requirePermission(PERMISSIONS.ASSET_DELETE),
    requireNotReadOnly,
    assetsController.deleteAsset
);