import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as approvalsController from "../controllers/approvals";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";

export const approvalsRouter = Router();

approvalsRouter.use(requireAuth);

// ─── List Pending Approvals ───────────────────────────────────────────────────
approvalsRouter.get(
  "/",
  requirePermission(PERMISSIONS.ASSET_DISPOSE),
  approvalsController.listPendingApprovals
);

// ─── Request Disposal Approval ────────────────────────────────────────────────
approvalsRouter.post(
  "/assets/:assetId/disposal",
  requirePermission(PERMISSIONS.ASSET_DISPOSE),
  approvalsController.requestDisposalApproval
);

// ─── Request Transfer Approval ────────────────────────────────────────────────
approvalsRouter.post(
  "/assets/:assetId/transfer",
  requirePermission(PERMISSIONS.ASSET_TRANSFER),
  approvalsController.requestTransferApproval
);

// ─── Decide Disposal Approval ─────────────────────────────────────────────────
approvalsRouter.patch(
  "/:approvalId/disposal/decision",
  requirePermission(PERMISSIONS.ASSET_DISPOSE),
  approvalsController.decideDisposalApproval
);

// ─── Decide Transfer Approval ─────────────────────────────────────────────────
approvalsRouter.patch(
  "/:approvalId/transfer/decision",
  requirePermission(PERMISSIONS.ASSET_TRANSFER),
  approvalsController.decideTransferApproval
);

// ─── List Asset Approvals ─────────────────────────────────────────────────────
approvalsRouter.get(
  "/assets/:assetId",
  requirePermission(PERMISSIONS.ASSET_READ),
  approvalsController.listAssetApprovals
);