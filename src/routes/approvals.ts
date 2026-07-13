import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as approvalsController from "../controllers/approvals";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";
import { requireNotReadOnly } from "../middlewares/scope";
import { approvalRateLimit } from "../middlewares/rateLimit";

export const approvalsRouter = Router();

approvalsRouter.use(requireAuth);

// ─── List Pending Approvals ───────────────────────────────────────────────────
// Admin, Org Admin, Finance — anyone who can approve sees the queue
approvalsRouter.get(
  "/",
  requirePermission(PERMISSIONS.ASSET_DISPOSE_APPROVE),
  approvalsController.listPendingApprovals
);

// ─── Request Disposal Approval ────────────────────────────────────────────────
// Asset Manager initiates — requires ASSET_DISPOSE permission
// System checks if proceeds exceed threshold and routes accordingly
approvalsRouter.post(
  "/assets/:assetId/disposal",
  requirePermission(PERMISSIONS.ASSET_DISPOSE),
  requireNotReadOnly,
  approvalRateLimit,
  approvalsController.requestDisposalApproval
);

// ─── Request Transfer Approval ────────────────────────────────────────────────
// Asset Manager initiates high-value transfer approval
approvalsRouter.post(
  "/assets/:assetId/transfer",
  requirePermission(PERMISSIONS.ASSET_TRANSFER),
  requireNotReadOnly,
  approvalRateLimit,
  approvalsController.requestTransferApproval
);

// ─── Decide Disposal Approval ─────────────────────────────────────────────────
// Finance User or Admin approves or rejects
// ASSET_DISPOSE_APPROVE is held by Finance and Admin only
approvalsRouter.patch(
  "/:approvalId/disposal/decision",
  requirePermission(PERMISSIONS.ASSET_DISPOSE_APPROVE),
  requireNotReadOnly,
  approvalsController.decideDisposalApproval
);

// ─── Decide Transfer Approval ─────────────────────────────────────────────────
// Admin and Org Admin only can approve high-value transfers
// ASSET_DISPOSE_APPROVE used here — Finance can also approve per matrix
approvalsRouter.patch(
  "/:approvalId/transfer/decision",
  requirePermission(PERMISSIONS.ASSET_DISPOSE_APPROVE),
  requireNotReadOnly,
  approvalsController.decideTransferApproval
);

// ─── List Asset Approvals ─────────────────────────────────────────────────────
// Anyone who can read assets can see approval history for that asset
approvalsRouter.get(
  "/assets/:assetId",
  requirePermission(PERMISSIONS.ASSET_READ),
  approvalsController.listAssetApprovals
);