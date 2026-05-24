import {
  createAsset,
  findAssetById,
  listAssetDepreciationSnapshots,
  listAssets,
  listAssetTransfers,
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
  const record = await updateAssetById(organizationId, assetId, actorUserId, payload);
  if (!record) throw new NotFoundError("Asset");
  logger.info("Asset updated", { organizationId, actorUserId, assetId });
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
