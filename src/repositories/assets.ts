import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
  lte,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { db } from "../db";
import {
  assetDisposals,
  assetDepreciationSnapshots,
  assetLifecycleEvents,
  assets,
  assetTransfers,
} from "../model/asset";
import {
  AssetAuditSummary,
  AssetLifecycleQuery,
  AssetListQuery,
  CreateAssetInput,
  DisposeAssetInput,
  RecordAssetDepreciationInput,
  RestoreAssetInput,
  TransferAssetInput,
  UpdateAssetInput,
} from "../types/assets";
import { AppError, ConflictError, DatabaseError } from "../utils/error";

type AssetRecognitionPersistenceInput = {
  hasFutureEconomicBenefit?: boolean;
  costCanBeReliablyMeasured?: boolean;
  recognitionStatus?: "recognized" | "not_recognized" | "pending_review";
  accountingTreatment?:
    | "capitalized"
    | "expensed"
    | "tracked_non_capitalized"
    | "pending_review";
  recognitionReasons?: string[];
  capitalizationThresholdApplied?: string | null;
};

type CreateAssetRepositoryInput = CreateAssetInput &
  AssetRecognitionPersistenceInput;

type UpdateAssetRepositoryInput = UpdateAssetInput &
  AssetRecognitionPersistenceInput;

type PgLikeError = {
  code?: string;
  constraint?: string;
  detail?: string;
  message?: string;
  cause?: unknown;
  originalError?: unknown;
};

const unwrapPgError = (input: unknown): PgLikeError | undefined => {
  const seen = new Set<unknown>();
  const queue: unknown[] = [input];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) {
      continue;
    }
    seen.add(current);

    const candidate = current as PgLikeError;
    if (candidate.code || candidate.constraint || candidate.detail) {
      return candidate;
    }

    if (candidate.cause) queue.push(candidate.cause);
    if (candidate.originalError) queue.push(candidate.originalError);
  }

  return undefined;
};

const mapAssetDbError = (error: unknown): never => {
  if (error instanceof AppError) {
    throw error;
  }
  const wrapped = error as { message?: string };
  const dbError = unwrapPgError(error) ?? (error as PgLikeError);

  if (dbError?.code === "23505") {
    if (dbError.constraint === "assets_org_asset_tag_uq") {
      throw new ConflictError("Asset tag already exists in this organization");
    }
    if (dbError.constraint === "assets_org_serial_number_uq") {
      throw new ConflictError("Serial number already exists in this organization");
    }
    throw new ConflictError("Duplicate value violates unique constraint");
  }

  if (dbError?.code === "23503") {
    throw new ConflictError(
      dbError.detail || "Invalid relational reference in asset payload",
    );
  }

  if (dbError?.code === "22P02") {
    throw new ConflictError(dbError.detail || "Invalid value format in asset payload");
  }

  if (dbError?.code === "23514") {
    throw new ConflictError(dbError.detail || "Asset payload violates a DB check constraint");
  }

  throw new DatabaseError(
    dbError?.detail ||
      dbError?.message ||
      wrapped?.message ||
      "Asset data operation failed",
    false,
  );
};

const buildAssetFilters = (
  organizationId: string,
  query?: Partial<AssetListQuery>,
): SQL[] => {
  const filters: SQL[] = [eq(assets.organizationId, organizationId)];

  if (!query?.includeDeleted) {
    filters.push(isNull(assets.deletedAt));
  }

  if (query?.status) {
    filters.push(eq(assets.status, query.status));
  }

  if (query?.branchId) {
    filters.push(eq(assets.branchId, query.branchId));
  }

  if (query?.assignedTo) {
    filters.push(eq(assets.assignedTo, query.assignedTo));
  }

  if (query?.search) {
    const searchPattern = `%${query.search}%`;
    filters.push(
      or(
        ilike(assets.name, searchPattern),
        ilike(assets.assetTag, searchPattern),
        sql`${assets.serialNumber} ilike ${searchPattern}`,
        sql`${assets.description} ilike ${searchPattern}`,
      ) ?? sql`false`,
    );
  }

  if (query?.purchasedFrom) {
    filters.push(gte(assets.purchaseDate, query.purchasedFrom));
  }

  if (query?.purchasedTo) {
    filters.push(lte(assets.purchaseDate, query.purchasedTo));
  }

  return filters;
};

export const createAsset = async (
  organizationId: string,
  actorUserId: string,
  payload: CreateAssetRepositoryInput,
) => {
  try {
    return await db.transaction(async (tx) => {
      const [record] = await tx
        .insert(assets)
        .values({
          organizationId,
          ...payload,
          purchaseCost: String(payload.purchaseCost),
          residualValue:
            payload.residualValue === undefined
              ? null
              : String(payload.residualValue),
          purchaseDate: payload.purchaseDate ?? null,
          warrantyExpiryDate: payload.warrantyExpiryDate ?? null,
          createdByUserId: actorUserId,
          updatedByUserId: actorUserId,
        })
        .returning();

      if (!record) {
        throw new DatabaseError("Failed to create asset");
      }

      await tx.insert(assetLifecycleEvents).values({
        organizationId,
        assetId: record.id,
        eventType: "registered",
        newStatus: record.status,
        description: "Asset registered",
        metadata: {
          assetTag: record.assetTag,
          assignedTo: record.assignedTo,
          branchId: record.branchId,
        },
        actorUserId,
      });

      return record;
    });
  } catch (error) {
    mapAssetDbError(error);
  }
};

export const bulkCreateAssetsAtomic = async (
  organizationId: string,
  actorUserId: string,
  payloads: CreateAssetRepositoryInput[],
) => {
  if (payloads.length === 0) {
    return [];
  }

  try {
    return await db.transaction(async (tx) => {
      const values = payloads.map((payload) => ({
        organizationId,
        ...payload,
        purchaseCost: String(payload.purchaseCost),
        residualValue:
          payload.residualValue === undefined
            ? null
            : String(payload.residualValue),
        purchaseDate: payload.purchaseDate ?? null,
        warrantyExpiryDate: payload.warrantyExpiryDate ?? null,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      }));

      const inserted = await tx.insert(assets).values(values).returning();

      if (inserted.length !== values.length) {
        throw new DatabaseError("Bulk insert was not fully applied", false);
      }

      await tx.insert(assetLifecycleEvents).values(
        inserted.map((record) => ({
          organizationId,
          assetId: record.id,
          eventType: "registered" as const,
          newStatus: record.status,
          description: "Asset registered (bulk import)",
          metadata: {
            assetTag: record.assetTag,
            assignedTo: record.assignedTo,
            branchId: record.branchId,
          },
          actorUserId,
        })),
      );

      return inserted;
    });
  } catch (error) {
    mapAssetDbError(error);
  }
};

export const listAssets = async (
  organizationId: string,
  query: AssetListQuery,
) => {
  const filters = buildAssetFilters(organizationId, query);
  const whereClause = and(...filters);

  const [totalResult] = await db
    .select({ total: count() })
    .from(assets)
    .where(whereClause);

  const offset = (query.page - 1) * query.limit;

  const rows = await db
    .select()
    .from(assets)
    .where(whereClause)
    .orderBy(
      query.sortBy === "name"
        ? query.sortOrder === "asc"
          ? asc(assets.name)
          : desc(assets.name)
        : query.sortBy === "purchaseDate"
          ? query.sortOrder === "asc"
            ? asc(assets.purchaseDate)
            : desc(assets.purchaseDate)
          : query.sortBy === "status"
            ? query.sortOrder === "asc"
              ? asc(assets.status)
              : desc(assets.status)
            : query.sortBy === "assetTag"
              ? query.sortOrder === "asc"
                ? asc(assets.assetTag)
                : desc(assets.assetTag)
              : query.sortOrder === "asc"
                ? asc(assets.createdAt)
                : desc(assets.createdAt),
      asc(assets.id),
    )
    .limit(query.limit)
    .offset(offset);

  const total = Number(totalResult?.total ?? 0);

  return {
    data: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
};

export const findAssetById = async (
  organizationId: string,
  assetId: string,
  includeDeleted = false,
) => {
  const filters: SQL[] = [
    eq(assets.organizationId, organizationId),
    eq(assets.id, assetId),
  ];

  if (!includeDeleted) {
    filters.push(isNull(assets.deletedAt));
  }

  const [record] = await db
    .select()
    .from(assets)
    .where(and(...filters))
    .limit(1);

  return record;
};

export const updateAssetById = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
  payload: UpdateAssetRepositoryInput,
) => {
  const updatePayload: Partial<typeof assets.$inferInsert> = {
    updatedByUserId: actorUserId,
    updatedAt: new Date(),
  };

  if (payload.name !== undefined) updatePayload.name = payload.name;
  if (payload.description !== undefined) updatePayload.description = payload.description;
  if (payload.assetTag !== undefined) updatePayload.assetTag = payload.assetTag;
  if (payload.serialNumber !== undefined) updatePayload.serialNumber = payload.serialNumber;
  if (payload.category !== undefined) updatePayload.category = payload.category;
  if (payload.manufacturer !== undefined) updatePayload.manufacturer = payload.manufacturer;
  if (payload.model !== undefined) updatePayload.model = payload.model;
  if (payload.branchId !== undefined) updatePayload.branchId = payload.branchId;
  if (payload.assignedTo !== undefined) updatePayload.assignedTo = payload.assignedTo;
  if (payload.status !== undefined) updatePayload.status = payload.status;
  if (payload.condition !== undefined) updatePayload.condition = payload.condition;
  if (payload.expectedUsefulLifeMonths !== undefined) {
    updatePayload.expectedUsefulLifeMonths = payload.expectedUsefulLifeMonths;
  }
  if (payload.qrCodeUrl !== undefined) updatePayload.qrCodeUrl = payload.qrCodeUrl;
  if (payload.isDepreciable !== undefined) {
    updatePayload.isDepreciable = payload.isDepreciable;
  }
  if (payload.hasFutureEconomicBenefit !== undefined) {
    updatePayload.hasFutureEconomicBenefit = payload.hasFutureEconomicBenefit;
  }
  if (payload.costCanBeReliablyMeasured !== undefined) {
    updatePayload.costCanBeReliablyMeasured = payload.costCanBeReliablyMeasured;
  }
  if (payload.recognitionStatus !== undefined) {
    updatePayload.recognitionStatus = payload.recognitionStatus;
  }
  if (payload.accountingTreatment !== undefined) {
    updatePayload.accountingTreatment = payload.accountingTreatment;
  }
  if (payload.recognitionReasons !== undefined) {
    updatePayload.recognitionReasons = payload.recognitionReasons;
  }
  if (payload.capitalizationThresholdApplied !== undefined) {
    updatePayload.capitalizationThresholdApplied =
      payload.capitalizationThresholdApplied;
  }

  if (payload.purchaseCost !== undefined) {
    updatePayload.purchaseCost = String(payload.purchaseCost);
  }

  if (payload.residualValue !== undefined) {
    updatePayload.residualValue = String(payload.residualValue);
  }

  if (payload.purchaseDate !== undefined) {
    updatePayload.purchaseDate = payload.purchaseDate ?? null;
  }

  if (payload.warrantyExpiryDate !== undefined) {
    updatePayload.warrantyExpiryDate = payload.warrantyExpiryDate ?? null;
  }

  try {
    return await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(assets)
        .where(
          and(
            eq(assets.organizationId, organizationId),
            eq(assets.id, assetId),
            isNull(assets.deletedAt),
          ),
        )
        .limit(1);

      if (!current) return undefined;

      const [record] = await tx
        .update(assets)
        .set(updatePayload)
        .where(
          and(
            eq(assets.organizationId, organizationId),
            eq(assets.id, assetId),
            isNull(assets.deletedAt),
          ),
        )
        .returning();

      if (!record) return undefined;

      const eventType =
        record.assignedTo !== current.assignedTo
          ? "assigned"
          : record.status !== current.status
            ? "status_changed"
            : "updated";

      await tx.insert(assetLifecycleEvents).values({
        organizationId,
        assetId,
        eventType,
        previousStatus: current.status,
        newStatus: record.status,
        description:
          eventType === "assigned"
            ? "Asset assignment changed"
            : eventType === "status_changed"
              ? `Asset status changed from ${current.status} to ${record.status}`
              : "Asset details updated",
        metadata: {
          previousAssignedTo: current.assignedTo,
          assignedTo: record.assignedTo,
          changedFields: Object.keys(payload),
        },
        actorUserId,
      });

      return record;
    });
  } catch (error) {
    mapAssetDbError(error);
  }
};

export const softDeleteAssetById = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
) => {
  try {
    return await db.transaction(async (tx) => {
      const [record] = await tx
        .update(assets)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
          updatedByUserId: actorUserId,
        })
        .where(
          and(
            eq(assets.organizationId, organizationId),
            eq(assets.id, assetId),
            isNull(assets.deletedAt),
          ),
        )
        .returning();

      if (!record) return undefined;

      await tx.insert(assetLifecycleEvents).values({
        organizationId,
        assetId,
        eventType: "deleted",
        previousStatus: record.status,
        newStatus: record.status,
        description: "Asset soft-deleted",
        actorUserId,
      });

      return record;
    });
  } catch (error) {
    mapAssetDbError(error);
  }
};

export const transferAsset = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
  payload: TransferAssetInput,
) => {
  try {
    return await db.transaction(async (tx) => {
      const [currentAsset] = await tx
        .select()
        .from(assets)
        .where(
          and(
            eq(assets.organizationId, organizationId),
            eq(assets.id, assetId),
            isNull(assets.deletedAt),
          ),
        )
        .limit(1);

      if (!currentAsset) {
        return null;
      }

      const nextBranchId = payload.toBranchId ?? currentAsset.branchId;
      const nextAssignedTo = payload.toUserId ?? currentAsset.assignedTo;
      if (
        nextBranchId === currentAsset.branchId &&
        nextAssignedTo === currentAsset.assignedTo
      ) {
        throw new ConflictError(
          "Transfer must change at least branch or assignee",
        );
      }

      const [updatedAsset] = await tx
        .update(assets)
        .set({
          branchId: nextBranchId,
          assignedTo: nextAssignedTo,
          updatedByUserId: actorUserId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(assets.organizationId, organizationId),
            eq(assets.id, assetId),
            isNull(assets.deletedAt),
          ),
        )
        .returning();

      if (!updatedAsset) {
        throw new DatabaseError(
          "Failed to update asset during transfer",
          false,
        );
      }

      const [transferRecord] = await tx
        .insert(assetTransfers)
        .values({
          organizationId,
          assetId,
          fromBranchId: currentAsset.branchId,
          toBranchId: payload.toBranchId ?? null,
          fromUserId: currentAsset.assignedTo,
          toUserId: payload.toUserId ?? null,
          reason: payload.reason ?? null,
          transferredByUserId: actorUserId,
        })
        .returning();

      await tx.insert(assetLifecycleEvents).values({
        organizationId,
        assetId,
        eventType: "transferred",
        previousStatus: currentAsset.status,
        newStatus: updatedAsset.status,
        description: payload.reason || "Asset transferred",
        metadata: {
          transferId: transferRecord?.id,
          fromBranchId: currentAsset.branchId,
          toBranchId: updatedAsset.branchId,
          fromUserId: currentAsset.assignedTo,
          toUserId: updatedAsset.assignedTo,
        },
        actorUserId,
      });

      return { updatedAsset, transferRecord };
    });
  } catch (error) {
    mapAssetDbError(error);
  }
};

export const listAssetTransfers = async (
  organizationId: string,
  assetId: string,
) => {
  return db
    .select()
    .from(assetTransfers)
    .where(
      and(
        eq(assetTransfers.organizationId, organizationId),
        eq(assetTransfers.assetId, assetId),
      ),
    )
    .orderBy(desc(assetTransfers.transferredAt));
};

export const transitionAssetStatus = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
  newStatus: "active" | "maintenance" | "disposed",
  eventType:
    | "status_changed"
    | "maintenance_started"
    | "maintenance_completed",
  description: string,
  metadata: Record<string, unknown> = {},
) => {
  try {
    return await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(assets)
        .where(
          and(
            eq(assets.organizationId, organizationId),
            eq(assets.id, assetId),
            isNull(assets.deletedAt),
          ),
        )
        .limit(1);

      if (!current) return undefined;
      if (current.status === "disposed" && newStatus !== "disposed") {
        throw new ConflictError("Disposed assets must be restored before changing status");
      }

      const [record] = await tx
        .update(assets)
        .set({
          status: newStatus,
          updatedByUserId: actorUserId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(assets.organizationId, organizationId),
            eq(assets.id, assetId),
            isNull(assets.deletedAt),
          ),
        )
        .returning();

      if (!record) return undefined;

      await tx.insert(assetLifecycleEvents).values({
        organizationId,
        assetId,
        eventType,
        previousStatus: current.status,
        newStatus,
        description,
        metadata,
        actorUserId,
      });

      return record;
    });
  } catch (error) {
    mapAssetDbError(error);
  }
};

export const recordAssetLifecycleEvent = async (input: {
  organizationId: string;
  assetId: string;
  actorUserId: string;
  eventType:
    | "maintenance_scheduled"
    | "depreciation_recorded";
  description: string;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}) => {
  try {
    const [asset] = await db
      .select({ id: assets.id, status: assets.status })
      .from(assets)
      .where(
        and(
          eq(assets.organizationId, input.organizationId),
          eq(assets.id, input.assetId),
          isNull(assets.deletedAt),
        ),
      )
      .limit(1);

    if (!asset) return undefined;

    const [event] = await db
      .insert(assetLifecycleEvents)
      .values({
        organizationId: input.organizationId,
        assetId: input.assetId,
        eventType: input.eventType,
        previousStatus: asset.status,
        newStatus: asset.status,
        description: input.description,
        metadata: input.metadata ?? {},
        actorUserId: input.actorUserId,
        occurredAt: input.occurredAt ?? new Date(),
      })
      .returning();

    return event;
  } catch (error) {
    mapAssetDbError(error);
  }
};

export const disposeAssetById = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
  payload: DisposeAssetInput,
) => {
  try {
    return await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(assets)
        .where(
          and(
            eq(assets.organizationId, organizationId),
            eq(assets.id, assetId),
            isNull(assets.deletedAt),
          ),
        )
        .limit(1);

      if (!current) return undefined;
      if (current.status === "disposed") {
        throw new ConflictError("Asset is already disposed");
      }

      const [disposal] = await tx
        .insert(assetDisposals)
        .values({
          organizationId,
          assetId,
          method: payload.method,
          reason: payload.reason,
          proceeds: String(payload.proceeds),
          disposedAt: payload.disposedAt ?? new Date(),
          disposedByUserId: actorUserId,
          approvedByUserId: payload.approvedByUserId ?? null,
          notes: payload.notes ?? null,
        })
        .returning();

      const [asset] = await tx
        .update(assets)
        .set({
          status: "disposed",
          assignedTo: null,
          updatedByUserId: actorUserId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(assets.organizationId, organizationId),
            eq(assets.id, assetId),
            isNull(assets.deletedAt),
          ),
        )
        .returning();

      if (!asset || !disposal) {
        throw new DatabaseError("Failed to dispose asset", false);
      }

      await tx.insert(assetLifecycleEvents).values({
        organizationId,
        assetId,
        eventType: "disposed",
        previousStatus: current.status,
        newStatus: "disposed",
        description: payload.reason,
        metadata: {
          disposalId: disposal.id,
          method: disposal.method,
          proceeds: disposal.proceeds,
          previousAssignedTo: current.assignedTo,
        },
        actorUserId,
        occurredAt: disposal.disposedAt,
      });

      return { asset, disposal };
    });
  } catch (error) {
    mapAssetDbError(error);
  }
};

export const restoreAssetById = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
  payload: RestoreAssetInput,
) => {
  try {
    return await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(assets)
        .where(
          and(
            eq(assets.organizationId, organizationId),
            eq(assets.id, assetId),
          ),
        )
        .limit(1);

      if (!current) return undefined;
      if (!current.deletedAt && current.status !== "disposed") {
        throw new ConflictError("Asset is already active in the lifecycle");
      }

      const [asset] = await tx
        .update(assets)
        .set({
          status: payload.status,
          deletedAt: null,
          updatedByUserId: actorUserId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(assets.organizationId, organizationId),
            eq(assets.id, assetId),
            or(isNotNull(assets.deletedAt), eq(assets.status, "disposed")),
          ),
        )
        .returning();

      if (!asset) {
        throw new ConflictError(
          "Asset restore failed: concurrent modification detected",
        );
      }

      await tx.insert(assetLifecycleEvents).values({
        organizationId,
        assetId,
        eventType: "restored",
        previousStatus: current.status,
        newStatus: payload.status,
        description: payload.reason,
        metadata: {
          wasDeleted: Boolean(current.deletedAt),
        },
        actorUserId,
      });

      return asset;
    });
  } catch (error) {
    mapAssetDbError(error);
  }
};

export const listAssetLifecycleEvents = async (
  organizationId: string,
  assetId: string,
  query: AssetLifecycleQuery,
) => {
  const filters: SQL[] = [
    eq(assetLifecycleEvents.organizationId, organizationId),
    eq(assetLifecycleEvents.assetId, assetId),
  ];
  if (query.eventType) {
    filters.push(eq(assetLifecycleEvents.eventType, query.eventType));
  }

  const whereClause = and(...filters);
  const offset = (query.page - 1) * query.limit;
  const [[totalResult], rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(assetLifecycleEvents)
      .where(whereClause),
    db
      .select()
      .from(assetLifecycleEvents)
      .where(whereClause)
      .orderBy(
        desc(assetLifecycleEvents.occurredAt),
        desc(assetLifecycleEvents.id),
      )
      .limit(query.limit)
      .offset(offset),
  ]);

  const total = Number(totalResult?.total ?? 0);
  return {
    data: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
};

export const listAssetDisposals = async (
  organizationId: string,
  assetId: string,
) =>
  db
    .select()
    .from(assetDisposals)
    .where(
      and(
        eq(assetDisposals.organizationId, organizationId),
        eq(assetDisposals.assetId, assetId),
      ),
    )
    .orderBy(desc(assetDisposals.disposedAt));

export const listAssetDepreciationSnapshots = async (
  organizationId: string,
  assetId: string,
) => {
  return db
    .select()
    .from(assetDepreciationSnapshots)
    .where(
      and(
        eq(assetDepreciationSnapshots.organizationId, organizationId),
        eq(assetDepreciationSnapshots.assetId, assetId),
      ),
    )
    .orderBy(desc(assetDepreciationSnapshots.fiscalYear));
};

export const recordAssetDepreciation = async (
  organizationId: string,
  assetId: string,
  actorUserId: string,
  payload: RecordAssetDepreciationInput,
) => {
  try {
    return await db.transaction(async (tx) => {
      const [asset] = await tx
        .select()
        .from(assets)
        .where(
          and(
            eq(assets.organizationId, organizationId),
            eq(assets.id, assetId),
            isNull(assets.deletedAt),
          ),
        )
        .limit(1);

      if (!asset) return undefined;
      if (!asset.isDepreciable) {
        throw new ConflictError("Asset is not marked as depreciable");
      }
      if (asset.accountingTreatment !== "capitalized") {
        throw new ConflictError("Only capitalized assets can be depreciated");
      }

      const [snapshot] = await tx
        .insert(assetDepreciationSnapshots)
        .values({
          organizationId,
          assetId,
          fiscalYear: payload.fiscalYear,
          periodUsedPriorYears: payload.periodUsedPriorYears,
          periodUsedCurrentYear: payload.periodUsedCurrentYear,
          accumulatedDepreciationBf: String(payload.accumulatedDepreciationBf),
          yearlyDepCharge: String(payload.yearlyDepCharge),
          totalAccumulatedDepreciation: String(
            payload.totalAccumulatedDepreciation,
          ),
          depreciationMethod: payload.depreciationMethod,
          runDate: payload.runDate ?? new Date(),
          createdByUserId: actorUserId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            assetDepreciationSnapshots.organizationId,
            assetDepreciationSnapshots.assetId,
            assetDepreciationSnapshots.fiscalYear,
          ],
          set: {
            periodUsedPriorYears: payload.periodUsedPriorYears,
            periodUsedCurrentYear: payload.periodUsedCurrentYear,
            accumulatedDepreciationBf: String(
              payload.accumulatedDepreciationBf,
            ),
            yearlyDepCharge: String(payload.yearlyDepCharge),
            totalAccumulatedDepreciation: String(
              payload.totalAccumulatedDepreciation,
            ),
            depreciationMethod: payload.depreciationMethod,
            runDate: payload.runDate ?? new Date(),
            createdByUserId: actorUserId,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!snapshot) {
        throw new DatabaseError("Failed to record depreciation", false);
      }

      await tx.insert(assetLifecycleEvents).values({
        organizationId,
        assetId,
        eventType: "depreciation_recorded",
        previousStatus: asset.status,
        newStatus: asset.status,
        description: `Depreciation recorded for fiscal year ${payload.fiscalYear}`,
        metadata: {
          snapshotId: snapshot.id,
          fiscalYear: payload.fiscalYear,
          yearlyDepCharge: payload.yearlyDepCharge,
          totalAccumulatedDepreciation:
            payload.totalAccumulatedDepreciation,
          depreciationMethod: payload.depreciationMethod,
        },
        actorUserId,
        occurredAt: snapshot.runDate,
      });

      return snapshot;
    });
  } catch (error) {
    mapAssetDbError(error);
  }
};

export const listWarrantyExpiringAssets = async (
  organizationId: string,
  daysAhead = 30,
) => {
  const now = new Date();
  const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return db
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.organizationId, organizationId),
        isNull(assets.deletedAt),
        gte(assets.warrantyExpiryDate, now),
        lte(assets.warrantyExpiryDate, until),
      ),
    )
    .orderBy(asc(assets.warrantyExpiryDate), asc(assets.id));
};

export const getAssetAuditSummary = async (
  organizationId: string,
  includeDeleted = false,
): Promise<AssetAuditSummary> => {
  const filters: SQL[] = [eq(assets.organizationId, organizationId)];
  if (!includeDeleted) {
    filters.push(isNull(assets.deletedAt));
  }

  const whereClause = and(...filters);
  const [result, recognitionRows] = await Promise.all([
    db
      .select({
        totalAssets: count(),
        missingSerialNumberCount:
          sql<number>`count(case when ${assets.serialNumber} is null then 1 end)`,
        missingPurchaseDateCount:
          sql<number>`count(case when ${assets.purchaseDate} is null then 1 end)`,
        missingCategoryCount:
          sql<number>`count(case when ${assets.category} is null then 1 end)`,
        disposedCount:
          sql<number>`count(case when ${assets.status} = 'disposed' then 1 end)`,
        maintenanceCount:
          sql<number>`count(case when ${assets.status} = 'maintenance' then 1 end)`,
      })
      .from(assets)
      .where(whereClause),
    db
      .select({
        accountingTreatment: assets.accountingTreatment,
        count: count(),
      })
      .from(assets)
      .where(whereClause)
      .groupBy(assets.accountingTreatment),
  ]);

  const [summary] = result;

  return {
    totalAssets: Number(summary?.totalAssets ?? 0),
    missingSerialNumberCount: Number(summary?.missingSerialNumberCount ?? 0),
    missingPurchaseDateCount: Number(summary?.missingPurchaseDateCount ?? 0),
    missingCategoryCount: Number(summary?.missingCategoryCount ?? 0),
    disposedCount: Number(summary?.disposedCount ?? 0),
    maintenanceCount: Number(summary?.maintenanceCount ?? 0),
    recognitionSummary: recognitionRows.map((row) => ({
      accountingTreatment: row.accountingTreatment,
      count: Number(row.count ?? 0),
    })),
  };
};
