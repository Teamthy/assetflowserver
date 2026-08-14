import {
  bulkSoftDeleteAssets,
  bulkTransferAssets,
  bulkUpdateAssetStatus,
} from "../repositories/bulk";
import { disposeAssetById, findAssetById } from "../repositories/assets";
import { requestDisposalApprovalService } from "./approvals.service";
import { notifyOrganizationAdmins } from "./notifications";
import { logger } from "../utils/logger";

const DISPOSAL_APPROVAL_THRESHOLD = 500_000;

// ─── Bulk Delete ──────────────────────────────────────────────────────────────

export async function bulkDeleteAssetsService(input: {
  organizationId: string;
  actorUserId: string;
  assetIds: string[];
  reason?: string;
}) {
  const { organizationId, actorUserId, assetIds, reason } = input;

  logger.info("[BulkService] Bulk delete started", {
    organizationId,
    actorUserId,
    count: assetIds.length,
  });

  const result = await bulkSoftDeleteAssets(
    organizationId,
    actorUserId,
    assetIds,
    reason
  );

  // Notify admins if any were deleted
  if (result.successful.length > 0) {
    await notifyOrganizationAdmins({
      organizationId,
      type: "asset_deleted",
      title: "Bulk asset deletion",
      message: `${result.successful.length} asset(s) were deleted in bulk.`,
      metadata: {
        deletedCount: result.successful.length,
        failedCount: result.failed.length,
        actorUserId,
        redirectUrl: "/assets",
      },
    });
  }

  logger.info("[BulkService] Bulk delete complete", {
    organizationId,
    successful: result.successful.length,
    failed: result.failed.length,
  });

  return result;
}

// ─── Bulk Transfer ────────────────────────────────────────────────────────────

export async function bulkTransferAssetsService(input: {
  organizationId: string;
  actorUserId: string;
  assetIds: string[];
  toBranchId?: string;
  toUserId?: string;
  reason?: string;
}) {
  const { organizationId, actorUserId, assetIds, toBranchId, toUserId, reason } =
    input;

  logger.info("[BulkService] Bulk transfer started", {
    organizationId,
    actorUserId,
    count: assetIds.length,
    toBranchId,
    toUserId,
  });

  const result = await bulkTransferAssets(
    organizationId,
    actorUserId,
    assetIds,
    toBranchId,
    toUserId,
    reason
  );

  logger.info("[BulkService] Bulk transfer complete", {
    organizationId,
    successful: result.successful.length,
    failed: result.failed.length,
  });

  return result;
}

// ─── Bulk Update Status ───────────────────────────────────────────────────────

export async function bulkUpdateStatusService(input: {
  organizationId: string;
  actorUserId: string;
  assetIds: string[];
  status: "active" | "maintenance";
  reason?: string;
}) {
  const { organizationId, actorUserId, assetIds, status, reason } = input;

  logger.info("[BulkService] Bulk status update started", {
    organizationId,
    actorUserId,
    count: assetIds.length,
    status,
  });

  const result = await bulkUpdateAssetStatus(
    organizationId,
    actorUserId,
    assetIds,
    status,
    reason
  );

  logger.info("[BulkService] Bulk status update complete", {
    organizationId,
    successful: result.successful.length,
    failed: result.failed.length,
  });

  return result;
}

// ─── Bulk Dispose ─────────────────────────────────────────────────────────────

export async function bulkDisposeAssetsService(input: {
  organizationId: string;
  actorUserId: string;
  assetIds: string[];
  method: "sold" | "donated" | "scrapped" | "lost" | "written_off" | "other";
  reason: string;
  proceeds: number;
  disposedAt?: Date;
  notes?: string;
}) {
  const { organizationId, actorUserId, assetIds } = input;
  const successful: string[] = [];
  const submittedForApproval: string[] = [];
  const failed: Array<{ assetId: string; reason: string }> = [];

  logger.info("[BulkService] Bulk dispose started", {
    organizationId,
    actorUserId,
    count: assetIds.length,
    method: input.method,
  });

  for (const assetId of assetIds) {
    try {
      const asset = await findAssetById(organizationId, assetId);
      if (!asset) {
        failed.push({ assetId, reason: "Asset not found" });
        continue;
      }
      if (asset.status === "disposed") {
        failed.push({ assetId, reason: "Asset is already disposed" });
        continue;
      }

      const cost = Number(asset.purchaseCost ?? 0);
      if (Number.isFinite(cost) && cost >= DISPOSAL_APPROVAL_THRESHOLD) {
        await requestDisposalApprovalService({
          organizationId,
          assetId,
          requestedByUserId: actorUserId,
          method: input.method,
          reason: input.reason,
          proceeds: input.proceeds,
          disposedAt: input.disposedAt,
          notes: input.notes,
        });
        submittedForApproval.push(assetId);
        continue;
      }

      const disposed = await disposeAssetById(organizationId, assetId, actorUserId, {
        method: input.method,
        reason: input.reason,
        proceeds: input.proceeds,
        disposedAt: input.disposedAt,
        notes: input.notes,
      });
      if (!disposed) {
        failed.push({ assetId, reason: "Asset not found" });
        continue;
      }
      successful.push(assetId);
    } catch (error) {
      failed.push({
        assetId,
        reason: error instanceof Error ? error.message : "Disposal failed",
      });
    }
  }

  logger.info("[BulkService] Bulk dispose complete", {
    organizationId,
    successful: successful.length,
    submittedForApproval: submittedForApproval.length,
    failed: failed.length,
  });

  return { successful, submittedForApproval, failed };
}