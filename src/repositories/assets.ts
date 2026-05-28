import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lte,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { db } from "../db";
import {
  assetDepreciationSnapshots,
  assets,
  assetTransfers,
} from "../model/asset";
import {
  AssetAuditSummary,
  AssetListQuery,
  CreateAssetInput,
  TransferAssetInput,
  UpdateAssetInput,
} from "../types/assets";
import { AppError, ConflictError, DatabaseError } from "../utils/error";

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
    filters.push(
      or(
        ilike(assets.name, `%${query.search}%`),
        ilike(assets.assetTag, `%${query.search}%`),
        ilike(assets.serialNumber, `%${query.search}%`),
        ilike(assets.description, `%${query.search}%`),
      )!,
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
  payload: CreateAssetInput,
) => {
  try {
    const [record] = await db
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

    return record;
  } catch (error) {
    mapAssetDbError(error);
  }
};

export const bulkCreateAssetsAtomic = async (
  organizationId: string,
  actorUserId: string,
  payloads: CreateAssetInput[],
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
  payload: UpdateAssetInput,
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
    const [record] = await db
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

    return record;
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
    const [record] = await db
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

    return record;
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
  const [result] = await db
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
    .where(whereClause);

  return {
    totalAssets: Number(result?.totalAssets ?? 0),
    missingSerialNumberCount: Number(result?.missingSerialNumberCount ?? 0),
    missingPurchaseDateCount: Number(result?.missingPurchaseDateCount ?? 0),
    missingCategoryCount: Number(result?.missingCategoryCount ?? 0),
    disposedCount: Number(result?.disposedCount ?? 0),
    maintenanceCount: Number(result?.maintenanceCount ?? 0),
  };
};
