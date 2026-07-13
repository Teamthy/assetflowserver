import { Router } from "express";
import multer from "multer";
import os from "node:os";
import path from "node:path";
import { env } from "../config/env";
import * as assetsController from "../controllers/assets";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permissions";
import { createRateLimit } from "../middlewares/rateLimit";

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
const heavyAssetOperationRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyPrefix: "assets-heavy",
});

export const assetsRouter = Router();

assetsRouter.use(requireAuth);

assetsRouter.get("/", requirePermission("assets.read"), assetsController.listAssets);
assetsRouter.get(
  "/export",
  heavyAssetOperationRateLimit,
  requirePermission("reports.read"),
  assetsController.exportAssets,
);
assetsRouter.post(
  "/import",
  heavyAssetOperationRateLimit,
  requirePermission("assets.write"),
  upload.single("file"),
  assetsController.importAssets,
);
assetsRouter.get("/audit", requirePermission("audit.read"), assetsController.getAssetsAudit);
assetsRouter.post("/", requirePermission("assets.write"), assetsController.createAsset);
assetsRouter.get(
  "/:id/timeline",
  requirePermission("assets.read"),
  assetsController.getAssetTimeline,
);
assetsRouter.post("/:id/dispose", requirePermission("assets.write"), assetsController.disposeAsset);
assetsRouter.post("/:id/restore", requirePermission("assets.write"), assetsController.restoreAsset);
assetsRouter.post(
  "/:id/depreciation",
  requirePermission("assets.write"),
  assetsController.recordAssetDepreciation,
);
assetsRouter.post("/:id/transfer", requirePermission("assets.write"), assetsController.transferAsset);
assetsRouter.get("/:id", requirePermission("assets.read"), assetsController.getAssetById);
assetsRouter.patch("/:id", requirePermission("assets.write"), assetsController.updateAsset);
assetsRouter.delete("/:id", requirePermission("assets.write"), assetsController.deleteAsset);
