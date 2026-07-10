import { eq } from "drizzle-orm";
import { db } from "../db";
import { assets } from "../model/asset";
import {
  createApprovalRequest,
  decideApproval,
  findApprovalById,
  findPendingApproval,
  listAssetApprovals,
  listPendingApprovals,
} from "../repositories/approvals";
import * as assetsRepository from "../repositories/assets";
import {
  createInAppNotification,
  notifyOrganizationAdmins,
} from "./notifications";
import {
  ConflictError,
  NotFoundError,
  AuthorizationError,
} from "../utils/error";
import { logger } from "../utils/logger";

const APPROVAL_EXPIRY_HOURS = 72;

// ─── Request Disposal Approval ────────────────────────────────────────────────

export async function requestDisposalApprovalService(input: {
  organizationId: string;
  assetId: string;
  requestedByUserId: string;
  method: string;
  reason: string;
  proceeds: number;
  disposedAt?: Date;
  notes?: string;
}) {
  const { organizationId, assetId, requestedByUserId } = input;

  // Verify asset exists and is not disposed
  const [asset] = await db
    .select({ id: assets.id, name: assets.name, assetTag: assets.assetTag, status: assets.status })
    .from(assets)
    .where(eq(assets.id, assetId))
    .limit(1);

  if (!asset) throw new NotFoundError("Asset");
  if (asset.status === "disposed") {
    throw new ConflictError("Asset is already disposed");
  }

  // Check for existing pending approval
  const existing = await findPendingApproval(organizationId, assetId, "disposal");
  if (existing) {
    throw new ConflictError(
      "A pending disposal approval already exists for this asset"
    );
  }

  // Create approval request
  const expiresAt = new Date(
    Date.now() + APPROVAL_EXPIRY_HOURS * 60 * 60 * 1000
  );

  const approval = await createApprovalRequest({
    organizationId,
    assetId,
    type: "disposal",
    requestedByUserId,
    payload: {
      method: input.method,
      reason: input.reason,
      proceeds: input.proceeds,
      disposedAt: input.disposedAt?.toISOString(),
      notes: input.notes,
    },
    requesterNotes: input.notes,
    expiresAt,
  });

  // Notify admins
  await notifyOrganizationAdmins({
    organizationId,
    type: "approval_required",
    title: "Disposal approval required",
    message: `${asset.name} (${asset.assetTag}) has been submitted for disposal approval.`,
    metadata: {
      approvalId: approval.id,
      assetId,
      assetName: asset.name,
      assetTag: asset.assetTag,
      method: input.method,
      requestedByUserId,
      redirectUrl: `/approvals/${approval.id}`,
    },
  });

  logger.info("[ApprovalsService] Disposal approval requested", {
    organizationId,
    assetId,
    approvalId: approval.id,
    requestedByUserId,
  });

  return approval;
}

// ─── Request Transfer Approval ────────────────────────────────────────────────

export async function requestTransferApprovalService(input: {
  organizationId: string;
  assetId: string;
  requestedByUserId: string;
  toBranchId?: string;
  toUserId?: string;
  reason?: string;
}) {
  const { organizationId, assetId, requestedByUserId } = input;

  // Verify asset exists
  const [asset] = await db
    .select({ id: assets.id, name: assets.name, assetTag: assets.assetTag, status: assets.status })
    .from(assets)
    .where(eq(assets.id, assetId))
    .limit(1);

  if (!asset) throw new NotFoundError("Asset");
  if (asset.status === "disposed") {
    throw new ConflictError("Cannot request transfer of a disposed asset");
  }

  // Check for existing pending approval
  const existing = await findPendingApproval(organizationId, assetId, "transfer");
  if (existing) {
    throw new ConflictError(
      "A pending transfer approval already exists for this asset"
    );
  }

  const expiresAt = new Date(
    Date.now() + APPROVAL_EXPIRY_HOURS * 60 * 60 * 1000
  );

  const approval = await createApprovalRequest({
    organizationId,
    assetId,
    type: "transfer",
    requestedByUserId,
    payload: {
      toBranchId: input.toBranchId,
      toUserId: input.toUserId,
      reason: input.reason,
    },
    requesterNotes: input.reason,
    expiresAt,
  });

  // Notify admins
  await notifyOrganizationAdmins({
    organizationId,
    type: "approval_required",
    title: "Transfer approval required",
    message: `${asset.name} (${asset.assetTag}) has been submitted for transfer approval.`,
    metadata: {
      approvalId: approval.id,
      assetId,
      assetName: asset.name,
      assetTag: asset.assetTag,
      toBranchId: input.toBranchId,
      toUserId: input.toUserId,
      requestedByUserId,
      redirectUrl: `/approvals/${approval.id}`,
    },
  });

  logger.info("[ApprovalsService] Transfer approval requested", {
    organizationId,
    assetId,
    approvalId: approval.id,
    requestedByUserId,
  });

  return approval;
}

// ─── Decide Disposal Approval ─────────────────────────────────────────────────

export async function decideDisposalApprovalService(input: {
  organizationId: string;
  approvalId: string;
  approverUserId: string;
  approved: boolean;
  notes?: string;
}) {
  const { organizationId, approvalId, approverUserId, approved, notes } = input;

  const approval = await findApprovalById(organizationId, approvalId);
  if (!approval) throw new NotFoundError("Approval");
  if (approval.status !== "pending") {
    throw new ConflictError(`Approval has already been ${approval.status}`);
  }
  if (approval.type !== "disposal") {
    throw new ConflictError("This approval is not a disposal approval");
  }

  // Record decision
  const decided = await decideApproval(
    organizationId,
    approvalId,
    approverUserId,
    approved ? "approved" : "rejected",
    notes
  );

  if (!decided) throw new ConflictError("Approval was modified concurrently");

  // If approved — execute the disposal
  if (approved) {
    const payload = approval.payload as {
      method: string;
      reason: string;
      proceeds: number;
      disposedAt?: string;
      notes?: string;
    };

    await assetsRepository.disposeAssetById(
      organizationId,
      approval.assetId,
      approverUserId,
      {
        method: payload.method as any,
        reason: payload.reason,
        proceeds: payload.proceeds,
        disposedAt: payload.disposedAt ? new Date(payload.disposedAt) : undefined,
        approvedByUserId: approverUserId,
        notes: payload.notes,
      }
    );

    logger.info("[ApprovalsService] Disposal approved and executed", {
      organizationId,
      approvalId,
      assetId: approval.assetId,
      approverUserId,
    });
  } else {
    logger.info("[ApprovalsService] Disposal rejected", {
      organizationId,
      approvalId,
      assetId: approval.assetId,
      approverUserId,
    });
  }

  // Notify requester
  await createInAppNotification({
    organizationId,
    userId: approval.requestedByUserId,
    type: "approval_required",
    title: approved ? "Disposal approved" : "Disposal rejected",
    message: approved
      ? "Your disposal request has been approved and executed."
      : `Your disposal request was rejected. ${notes ?? ""}`.trim(),
    metadata: {
      approvalId,
      assetId: approval.assetId,
      redirectUrl: `/assets/${approval.assetId}`,
    },
  });

  return decided;
}

// ─── Decide Transfer Approval ─────────────────────────────────────────────────

export async function decideTransferApprovalService(input: {
  organizationId: string;
  approvalId: string;
  approverUserId: string;
  approved: boolean;
  notes?: string;
}) {
  const { organizationId, approvalId, approverUserId, approved, notes } = input;

  const approval = await findApprovalById(organizationId, approvalId);
  if (!approval) throw new NotFoundError("Approval");
  if (approval.status !== "pending") {
    throw new ConflictError(`Approval has already been ${approval.status}`);
  }
  if (approval.type !== "transfer") {
    throw new ConflictError("This approval is not a transfer approval");
  }

  const decided = await decideApproval(
    organizationId,
    approvalId,
    approverUserId,
    approved ? "approved" : "rejected",
    notes
  );

  if (!decided) throw new ConflictError("Approval was modified concurrently");

  // If approved — execute the transfer
  if (approved) {
    const payload = approval.payload as {
      toBranchId?: string;
      toUserId?: string;
      reason?: string;
    };

    await assetsRepository.transferAsset(
      organizationId,
      approval.assetId,
      approverUserId,
      {
        toBranchId: payload.toBranchId,
        toUserId: payload.toUserId,
        reason: payload.reason,
      }
    );

    logger.info("[ApprovalsService] Transfer approved and executed", {
      organizationId,
      approvalId,
      assetId: approval.assetId,
      approverUserId,
    });
  }

  // Notify requester
  await createInAppNotification({
    organizationId,
    userId: approval.requestedByUserId,
    type: "approval_required",
    title: approved ? "Transfer approved" : "Transfer rejected",
    message: approved
      ? "Your transfer request has been approved and executed."
      : `Your transfer request was rejected. ${notes ?? ""}`.trim(),
    metadata: {
      approvalId,
      assetId: approval.assetId,
      redirectUrl: `/assets/${approval.assetId}`,
    },
  });

  return decided;
}

// ─── List Pending Approvals ───────────────────────────────────────────────────

export async function listPendingApprovalsService(
  organizationId: string,
  type?: "disposal" | "transfer"
) {
  return listPendingApprovals(organizationId, type);
}

// ─── List Asset Approvals ─────────────────────────────────────────────────────

export async function listAssetApprovalsService(
  organizationId: string,
  assetId: string
) {
  return listAssetApprovals(organizationId, assetId);
}