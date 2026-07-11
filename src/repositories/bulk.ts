import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import {
  assets,
  assetLifecycleEvents,
  assetTransfers,
} from "../model/asset";
import { logger } from "../utils/logger";

// ─── Bulk Delete ──────────────────────────────────────────────────────────────

export async function bulkSoftDeleteAssets(
  organizationId: string,
  actorUserId: string,
  assetIds: string[],
  reason?: string
): Promise<{
  successful: string[];
  failed: Array<{ assetId: string; reason: string }>;
}> {
  const successful: string[] = [];
  const failed: Array<{ assetId: string; reason: string }> = [];

  // Fetch all assets in one query
  const foundAssets = await db
    .select({ id: assets.id, status: assets.status })
    .from(assets)
    .where(
      and(
        eq(assets.organizationId, organizationId),
        inArray(assets.id, assetIds),
        isNull(assets.deletedAt)
      )
    );

  const foundIds = new Set(foundAssets.map((a) => a.id));

  // Report missing assets
  for (const id of assetIds) {
    if (!foundIds.has(id)) {
      failed.push({ assetId: id, reason: "Asset not found" });
    }
  }

  // Filter out disposed assets
  const deletableAssets = foundAssets.filter((a) => {
    if (a.status === "disposed") {
      failed.push({
        assetId: a.id,
        reason: "Cannot delete a disposed asset",
      });
      return false;
    }
    return true;
  });

  if (deletableAssets.length === 0) {
    return { successful, failed };
  }

  // Bulk soft delete in transaction
  await db.transaction(async (tx) => {
    const deletableIds = deletableAssets.map((a) => a.id);

    await tx
      .update(assets)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
        updatedByUserId: actorUserId,
      })
      .where(
        and(
          eq(assets.organizationId, organizationId),
          inArray(assets.id, deletableIds),
          isNull(assets.deletedAt)
        )
      );

    // Create lifecycle events
    await tx.insert(assetLifecycleEvents).values(
      deletableAssets.map((asset) => ({
        organizationId,
        assetId: asset.id,
        eventType: "deleted" as const,
        previousStatus: asset.status,
        newStatus: asset.status,
        description: reason
          ? `Asset bulk deleted: ${reason}`
          : "Asset bulk deleted",
        actorUserId,
      }))
    );

    successful.push(...deletableIds);
  });

  return { successful, failed };
}

// ─── Bulk Transfer ────────────────────────────────────────────────────────────

export async function bulkTransferAssets(
  organizationId: string,
  actorUserId: string,
  assetIds: string[],
  toBranchId?: string,
  toUserId?: string,
  reason?: string
): Promise<{
  successful: string[];
  failed: Array<{ assetId: string; reason: string }>;
}> {
  const successful: string[] = [];
  const failed: Array<{ assetId: string; reason: string }> = [];

  // Fetch all assets
  const foundAssets = await db
    .select({
      id: assets.id,
      status: assets.status,
      branchId: assets.branchId,
      assignedTo: assets.assignedTo,
    })
    .from(assets)
    .where(
      and(
        eq(assets.organizationId, organizationId),
        inArray(assets.id, assetIds),
        isNull(assets.deletedAt)
      )
    );

  const foundIds = new Set(foundAssets.map((a) => a.id));

  // Report missing
  for (const id of assetIds) {
    if (!foundIds.has(id)) {
      failed.push({ assetId: id, reason: "Asset not found" });
    }
  }

  // Filter out disposed assets
  const transferableAssets = foundAssets.filter((a) => {
    if (a.status === "disposed") {
      failed.push({
        assetId: a.id,
        reason: "Cannot transfer a disposed asset",
      });
      return false;
    }
    return true;
  });

  if (transferableAssets.length === 0) {
    return { successful, failed };
  }

  // Bulk transfer in transaction
  await db.transaction(async (tx) => {
    const updatePayload: Partial<typeof assets.$inferInsert> = {
      updatedByUserId: actorUserId,
      updatedAt: new Date(),
    };

    if (toBranchId) updatePayload.branchId = toBranchId;
    if (toUserId) updatePayload.assignedTo = toUserId;

    const transferableIds = transferableAssets.map((a) => a.id);

    await tx
      .update(assets)
      .set(updatePayload)
      .where(
        and(
          eq(assets.organizationId, organizationId),
          inArray(assets.id, transferableIds),
          isNull(assets.deletedAt)
        )
      );

    // Create transfer records
    await tx.insert(assetTransfers).values(
      transferableAssets.map((asset) => ({
        organizationId,
        assetId: asset.id,
        fromBranchId: asset.branchId,
        toBranchId: toBranchId ?? null,
        fromUserId: asset.assignedTo,
        toUserId: toUserId ?? null,
        reason: reason ?? null,
        transferredByUserId: actorUserId,
      }))
    );

    // Create lifecycle events
    await tx.insert(assetLifecycleEvents).values(
      transferableAssets.map((asset) => ({
        organizationId,
        assetId: asset.id,
        eventType: "transferred" as const,
        previousStatus: asset.status,
        newStatus: asset.status,
        description: reason ? `Bulk transfer: ${reason}` : "Bulk transfer",
        metadata: {
          fromBranchId: asset.branchId,
          toBranchId: toBranchId ?? null,
          fromUserId: asset.assignedTo,
          toUserId: toUserId ?? null,
          isBulk: true,
        },
        actorUserId,
      }))
    );

    successful.push(...transferableIds);
  });

  return { successful, failed };
}

// ─── Bulk Update Status ───────────────────────────────────────────────────────

export async function bulkUpdateAssetStatus(
  organizationId: string,
  actorUserId: string,
  assetIds: string[],
  newStatus: "active" | "maintenance",
  reason?: string
): Promise<{
  successful: string[];
  failed: Array<{ assetId: string; reason: string }>;
}> {
  const successful: string[] = [];
  const failed: Array<{ assetId: string; reason: string }> = [];

  // Fetch all assets
  const foundAssets = await db
    .select({ id: assets.id, status: assets.status })
    .from(assets)
    .where(
      and(
        eq(assets.organizationId, organizationId),
        inArray(assets.id, assetIds),
        isNull(assets.deletedAt)
      )
    );

  const foundIds = new Set(foundAssets.map((a) => a.id));

  // Report missing
  for (const id of assetIds) {
    if (!foundIds.has(id)) {
      failed.push({ assetId: id, reason: "Asset not found" });
    }
  }

  // Filter invalid status transitions
  const updatableAssets = foundAssets.filter((a) => {
    if (a.status === "disposed") {
      failed.push({
        assetId: a.id,
        reason: "Cannot update status of a disposed asset",
      });
      return false;
    }
    if (a.status === newStatus) {
      failed.push({
        assetId: a.id,
        reason: `Asset is already in ${newStatus} status`,
      });
      return false;
    }
    return true;
  });

  if (updatableAssets.length === 0) {
    return { successful, failed };
  }

  // Bulk update in transaction
  await db.transaction(async (tx) => {
    const updatableIds = updatableAssets.map((a) => a.id);

    await tx
      .update(assets)
      .set({
        status: newStatus,
        updatedByUserId: actorUserId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assets.organizationId, organizationId),
          inArray(assets.id, updatableIds),
          isNull(assets.deletedAt)
        )
      );

    // Create lifecycle events
    await tx.insert(assetLifecycleEvents).values(
      updatableAssets.map((asset) => ({
        organizationId,
        assetId: asset.id,
        eventType: "status_changed" as const,
        previousStatus: asset.status,
        newStatus,
        description: reason
          ? `Bulk status update: ${reason}`
          : `Status changed to ${newStatus} (bulk)`,
        metadata: { isBulk: true },
        actorUserId,
      }))
    );

    successful.push(...updatableIds);
  });

  return { successful, failed };
}