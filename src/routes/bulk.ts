import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as bulkController from "../controllers/bulk";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";

export const bulkRouter = Router();

bulkRouter.use(requireAuth);

// ─── Bulk Delete ──────────────────────────────────────────────────────────────
bulkRouter.post(
  "/assets/delete",
  requirePermission(PERMISSIONS.ASSET_DELETE),
  bulkController.bulkDeleteAssets
);

// ─── Bulk Transfer ────────────────────────────────────────────────────────────
bulkRouter.post(
  "/assets/transfer",
  requirePermission(PERMISSIONS.ASSET_TRANSFER),
  bulkController.bulkTransferAssets
);

// ─── Bulk Update Status ───────────────────────────────────────────────────────
bulkRouter.post(
  "/assets/status",
  requirePermission(PERMISSIONS.ASSET_UPDATE),
  bulkController.bulkUpdateStatus
);

// ─── Bulk Dispose ─────────────────────────────────────────────────────────────
bulkRouter.post(
  "/assets/dispose",
  requirePermission(PERMISSIONS.ASSET_DISPOSE),
  bulkController.bulkDisposeAssets
);