import {
  createAsset,
  findAssetById,
  listAssetDepreciationSnapshots,
  listAssets,
  listAssetTransfers,
  listWarrantyExpiringAssets,
  softDeleteAssetById,
  transferAsset,
  updateAssetById,
} from "../repositories/assets";
import { findOrganizationById } from "../repositories/organizations";
import {
  AssetListQuery,
  CreateAssetInput,
  TransferAssetInput,
  UpdateAssetInput,
} from "../types/assets";
import { NotFoundError, ValidationError } from "../utils/error";
import { logger } from "../utils/logger";
import {
  createInAppNotification,
  notifyOrganizationAdmins,
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

  if (payload.status === "disposed" && current.status !== "disposed") {
    if (record.assignedTo) {
      await createInAppNotification({
        organizationId,
        userId: record.assignedTo,
        type: "asset_disposed",
        title: "Asset disposed",
        message: `${record.name} (${record.assetTag}) has been marked as disposed.`,
        metadata: {
          assetId: record.id,
          redirectUrl: `/assets/${record.id}`,
        },
      });
    }

    await notifyOrganizationAdmins({
      organizationId,
      type: "asset_disposed",
      title: "Asset disposed",
      message: `${record.name} (${record.assetTag}) has been marked as disposed.`,
      metadata: {
        assetId: record.id,
        actorUserId,
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
) => {
  await getAssetByIdService(organizationId, assetId);

  const [transfers, depreciation] = await Promise.all([
    listAssetTransfers(organizationId, assetId),
    listAssetDepreciationSnapshots(organizationId, assetId),
  ]);

  return { transfers, depreciation };
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
