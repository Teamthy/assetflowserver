import { Router } from "express";
import multer from "multer";
import * as assetsController from "../controllers/assets";
import { requireAuth } from "../middlewares/auth";

const upload = multer({ storage: multer.memoryStorage() });

export const assetsRouter = Router();

assetsRouter.use(requireAuth);

assetsRouter.get("/", assetsController.listAssets);
assetsRouter.get("/export", assetsController.exportAssets);
assetsRouter.post("/import", upload.single("file"), assetsController.importAssets);
assetsRouter.get("/audit", assetsController.getAssetsAudit);
assetsRouter.post("/", assetsController.createAsset);
assetsRouter.get("/:id", assetsController.getAssetById);
assetsRouter.patch("/:id", assetsController.updateAsset);
assetsRouter.delete("/:id", assetsController.deleteAsset);
assetsRouter.post("/:id/transfer", assetsController.transferAsset);
