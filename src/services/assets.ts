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
import {
  AssetListQuery,
  CreateAssetInput,
  TransferAssetInput,
  UpdateAssetInput,
} from "../types/assets";
import { NotFoundError } from "../utils/error";

export const createAssetService = async (
  organizationId: string,
  actorUserId: string,
  payload: CreateAssetInput,
) => createAsset(organizationId, actorUserId, payload);

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
  return record;
};

export const deleteAssetService = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
) => {
  const record = await softDeleteAssetById(organizationId, assetId, actorUserId);
  if (!record) throw new NotFoundError("Asset");
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
