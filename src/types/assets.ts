import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  assetDisposals,
  assetDepreciationSnapshots,
  assetLifecycleEvents,
  assets,
  assetTransfers,
} from "../model/asset";
import {
  assetAuditQuerySchema,
  assetLifecycleQuerySchema,
  assetListQuerySchema,
  assetParamsSchema,
  createAssetSchema,
  disposeAssetSchema,
  exportAssetsQuerySchema,
  importAssetRowSchema,
  recordAssetDepreciationSchema,
  restoreAssetSchema,
  transferAssetSchema,
  updateAssetSchema,
} from "../validators/assets";
import { z } from "zod";

export type Asset = InferSelectModel<typeof assets>;
export type NewAsset = InferInsertModel<typeof assets>;

export type AssetTransfer = InferSelectModel<typeof assetTransfers>;
export type NewAssetTransfer = InferInsertModel<typeof assetTransfers>;

export type AssetDepreciationSnapshot = InferSelectModel<
  typeof assetDepreciationSnapshots
>;
export type AssetLifecycleEvent = InferSelectModel<typeof assetLifecycleEvents>;
export type AssetDisposal = InferSelectModel<typeof assetDisposals>;

export type AssetListQuery = z.infer<typeof assetListQuerySchema>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AssetParams = z.infer<typeof assetParamsSchema>;
export type TransferAssetInput = z.infer<typeof transferAssetSchema>;
export type DisposeAssetInput = z.infer<typeof disposeAssetSchema>;
export type RestoreAssetInput = z.infer<typeof restoreAssetSchema>;
export type RecordAssetDepreciationInput = z.infer<
  typeof recordAssetDepreciationSchema
>;
export type AssetLifecycleQuery = z.infer<typeof assetLifecycleQuerySchema>;
export type ImportAssetRowInput = z.infer<typeof importAssetRowSchema>;
export type AssetAuditQuery = z.infer<typeof assetAuditQuerySchema>;
export type ExportAssetsQuery = z.infer<typeof exportAssetsQuerySchema>;

export type AssetListResponse = {
  data: Asset[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AssetAuditSummary = {
  totalAssets: number;
  missingSerialNumberCount: number;
  missingPurchaseDateCount: number;
  missingCategoryCount: number;
  disposedCount: number;
  maintenanceCount: number;
};
