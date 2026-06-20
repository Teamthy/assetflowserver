import {
  createAsset,
  disposeAssetById,
  findAssetById,
  listAssetDisposals,
  listAssetDepreciationSnapshots,
  listAssetLifecycleEvents,
  listAssets,
  listAssetTransfers,
  listWarrantyExpiringAssets,
  recordAssetDepreciation,
  restoreAssetById,
  softDeleteAssetById,
  transferAsset,
  updateAssetById,
} from "../repositories/assets";
import { findOrganizationById } from "../repositories/organizations";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
import { organizationUsers } from "../model/user";
import {
  AssetLifecycleQuery,
  AssetListQuery,
  CreateAssetInput,
  DisposeAssetInput,
  RecordAssetDepreciationInput,
  RestoreAssetInput,
  TransferAssetInput,
  UpdateAssetInput,
} from "../types/assets";
import { listMaintenanceTasks } from "../repositories/maintenance";
import { NotFoundError, ValidationError } from "../utils/error";
import { logger } from "../utils/logger";
import {
  createInAppNotification,
  notifyOrganizationAdmins,
  notifyDepreciationRunCompleted,
  notifyWarrantyExpiringSoon,
} from "./notifications";

const assertBranchRequiredIfEnabled = async (
  organizationId: string,
  branchId: string | undefined,
) => {
  const organization = await findOrganizationById(organizationId);
  if (!organization) {
    throw new NotFoundError("Organization");
  }

  if (organization.multiBranchEnabled && !branchId) {
    throw new ValidationError("Validation failed", [
      {
        path: ["branchId"],
        message:
          "branchId is required when multi-branch mode is enabled for this organization",
      },
    ]);
  }
};

const assertActiveOrganizationMember = async (
  organizationId: string,
  userId: string | undefined,
  field: string,
) => {
  if (!userId) return;

  const [membership] = await db
    .select({ userId: organizationUsers.userId })
    .from(organizationUsers)
    .where(
      and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, userId),
        eq(organizationUsers.status, "active"),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new ValidationError("Validation failed", [
      {
        path: [field],
        message: "User must be an active member of this organization",
      },
    ]);
  }
};

export const createAssetService = async (
  organizationId: string,
  actorUserId: string,
  payload: CreateAssetInput,
) => {
  await assertBranchRequiredIfEnabled(organizationId, payload.branchId);
  const record = await createAsset(organizationId, actorUserId, payload);
  if (!record) {
    throw new NotFoundError("Asset");
  }
  logger.info("Asset created", {
    organizationId,
    actorUserId,
    assetId: record.id,
    assetTag: record.assetTag,
  });
  if (record.assignedTo) {
    await createInAppNotification({
      organizationId,
      userId: record.assignedTo,
      type: "asset_assigned",
      title: "Asset assigned to you",
      message: `${record.name} (${record.assetTag}) has been assigned to you.`,
      metadata: {
        assetId: record.id,
        redirectUrl: `/assets/${record.id}`,
      },
    });
  }
  return record;
};

export const listAssetsService = async (
  organizationId: string,
  query: AssetListQuery,
) => listAssets(organizationId, query);

export const getAssetByIdService = async (
  organizationId: string,
  assetId: string,
) => {
  const record = await findAssetById(organizationId, assetId);
  if (!record) throw new NotFoundError("Asset");
  return record;
};

export const updateAssetService = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
  payload: UpdateAssetInput,
) => {
  if (payload.status === "disposed") {
    throw new ValidationError("Validation failed", [
      {
        path: ["status"],
        message: "Use the asset disposal endpoint to dispose an asset",
      },
    ]);
  }

  const current = await getAssetByIdService(organizationId, assetId);
  const record = await updateAssetById(organizationId, assetId, actorUserId, payload);
  if (!record) throw new NotFoundError("Asset");
  logger.info("Asset updated", { organizationId, actorUserId, assetId });

  if (payload.assignedTo && payload.assignedTo !== current.assignedTo) {
    await createInAppNotification({
      organizationId,
      userId: payload.assignedTo,
      type: "asset_updated",
      title: "Asset assigned to you",
      message: `${record.name} (${record.assetTag}) has been assigned to you.`,
      metadata: {
        assetId: record.id,
        redirectUrl: `/assets/${record.id}`,
      },
    });
  }

  return record;
};

export const deleteAssetService = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
) => {
  const record = await softDeleteAssetById(organizationId, assetId, actorUserId);
  if (!record) throw new NotFoundError("Asset");
  logger.warn("Asset soft-deleted", { organizationId, actorUserId, assetId });

  if (record.assignedTo) {
    await createInAppNotification({
      organizationId,
      userId: record.assignedTo,
      type: "asset_deleted",
      title: "Asset removed",
      message: `${record.name} (${record.assetTag}) has been removed from active assets.`,
      metadata: {
        assetId: record.id,
        redirectUrl: `/assets/${record.id}`,
      },
    });
  }

  await notifyOrganizationAdmins({
    organizationId,
    type: "asset_deleted",
    title: "Asset removed",
    message: `${record.name} (${record.assetTag}) has been removed from active assets.`,
    metadata: {
      assetId: record.id,
      actorUserId,
      redirectUrl: `/assets/${record.id}`,
    },
  });

  return record;
};

export const transferAssetService = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
  payload: TransferAssetInput,
) => {
  const record = await transferAsset(organizationId, assetId, actorUserId, payload);
  if (!record) throw new NotFoundError("Asset");
  logger.info("Asset transferred", { organizationId, actorUserId, assetId });
  if (payload.toUserId) {
    await createInAppNotification({
      organizationId,
      userId: payload.toUserId,
      type: "asset_transferred",
      title: "Asset transferred to you",
      message: `An asset has been transferred to your custody.`,
      metadata: {
        assetId,
        redirectUrl: `/assets/${assetId}`,
      },
    });
  }
  return record;
};

export const getAssetTimelineService = async (
  organizationId: string,
  assetId: string,
  query: AssetLifecycleQuery,
) => {
  const asset = await findAssetById(organizationId, assetId, true);
  if (!asset) throw new NotFoundError("Asset");

  const [lifecycle, transfers, maintenance, depreciation, disposals] =
    await Promise.all([
      listAssetLifecycleEvents(organizationId, assetId, query),
      listAssetTransfers(organizationId, assetId),
      listMaintenanceTasks(organizationId, {
        page: 1,
        limit: 100,
        assetId,
      }),
      listAssetDepreciationSnapshots(organizationId, assetId),
      listAssetDisposals(organizationId, assetId),
    ]);

  return {
    asset,
    lifecycle,
    transfers,
    maintenance: maintenance.data,
    depreciation,
    disposals,
  };
};

export const disposeAssetService = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
  payload: DisposeAssetInput,
) => {
  await assertActiveOrganizationMember(
    organizationId,
    payload.approvedByUserId,
    "approvedByUserId",
  );
  const current = await getAssetByIdService(organizationId, assetId);
  const record = await disposeAssetById(
    organizationId,
    assetId,
    actorUserId,
    payload,
  );
  if (!record) throw new NotFoundError("Asset");

  const notification = {
    organizationId,
    type: "asset_disposed" as const,
    title: "Asset disposed",
    message: `${record.asset.name} (${record.asset.assetTag}) was disposed via ${payload.method}.`,
    metadata: {
      assetId,
      disposalId: record.disposal.id,
      method: payload.method,
      redirectUrl: `/assets/${assetId}`,
    },
  };

  if (current.assignedTo) {
    await createInAppNotification({
      ...notification,
      userId: current.assignedTo,
    });
  }
  await notifyOrganizationAdmins(notification);

  logger.warn("Asset disposed", {
    organizationId,
    assetId,
    actorUserId,
    method: payload.method,
  });
  return record;
};

export const restoreAssetService = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
  payload: RestoreAssetInput,
) => {
  const record = await restoreAssetById(
    organizationId,
    assetId,
    actorUserId,
    payload,
  );
  if (!record) throw new NotFoundError("Asset");

  await notifyOrganizationAdmins({
    organizationId,
    type: "asset_updated",
    title: "Asset restored",
    message: `${record.name} (${record.assetTag}) has been restored with status ${record.status}.`,
    metadata: {
      assetId,
      actorUserId,
      redirectUrl: `/assets/${assetId}`,
    },
  });

  logger.info("Asset restored", { organizationId, assetId, actorUserId });
  return record;
};

export const recordAssetDepreciationService = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
  payload: RecordAssetDepreciationInput,
) => {
  const snapshot = await recordAssetDepreciation(
    organizationId,
    assetId,
    actorUserId,
    payload,
  );
  if (!snapshot) throw new NotFoundError("Asset");

  await notifyDepreciationRunCompleted({
    organizationId,
    fiscalYear: payload.fiscalYear,
    processedCount: 1,
  });

  logger.info("Asset depreciation recorded", {
    organizationId,
    assetId,
    actorUserId,
    fiscalYear: payload.fiscalYear,
  });
  return snapshot;
};

export const notifyWarrantyExpiringAssetsService = async (
  organizationId: string,
  daysAhead = 30,
) => {
  const expiringAssets = await listWarrantyExpiringAssets(organizationId, daysAhead);

  await Promise.all(
    expiringAssets.map((asset) =>
      notifyWarrantyExpiringSoon({
        organizationId,
        assetId: asset.id,
        assetName: asset.name,
        assetTag: asset.assetTag,
        warrantyExpiryDate: asset.warrantyExpiryDate!,
      }),
    ),
  );

  return { notified: expiringAssets.length };
};
