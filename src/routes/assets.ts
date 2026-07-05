import { Router } from "express";
import multer from "multer";
import os from "node:os";
import path from "node:path";
import { env } from "../config/env";
import * as assetsController from "../controllers/assets";
import { requireAuth } from "../middlewares/auth";

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

assetsRouter.get("/", assetsController.listAssets);
assetsRouter.get("/export", assetsController.exportAssets);
assetsRouter.post("/import", upload.single("file"), assetsController.importAssets);
assetsRouter.get("/audit", assetsController.getAssetsAudit);
assetsRouter.post("/", assetsController.createAsset);
assetsRouter.get("/:id/timeline", assetsController.getAssetTimeline);
assetsRouter.post("/:id/dispose", assetsController.disposeAsset);
assetsRouter.post("/:id/restore", assetsController.restoreAsset);
assetsRouter.post(
  "/:id/depreciation",
  assetsController.recordAssetDepreciation,
);
assetsRouter.post("/:id/transfer", assetsController.transferAsset);
assetsRouter.get("/:id", assetsController.getAssetById);
assetsRouter.patch("/:id", assetsController.updateAsset);
assetsRouter.delete("/:id", assetsController.deleteAsset);
