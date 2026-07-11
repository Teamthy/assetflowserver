import {
  bulkSoftDeleteAssets,
  bulkTransferAssets,
  bulkUpdateAssetStatus,
} from "../repositories/bulk";
import { notifyOrganizationAdmins } from "./notifications";
import { logger } from "../utils/logger";

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