import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { assets } from "../model/asset";
import { maintenanceTasks } from "../model/maintenance";
import { notifications } from "../model/notification";
import { organizationUsers, users } from "../model/user";
import {
  findMaintenanceTaskById,
  listMaintenanceTasks,
} from "../repositories/maintenance";
import {
  CompleteMaintenanceInput,
  CreateMaintenanceInput,
  MaintenanceListQuery,
  UpdateMaintenanceInput,
} from "../types/maintenance";
import { ConflictError, NotFoundError, ValidationError } from "../utils/error";
import { logger } from "../utils/logger";

const assertAssetExistsInOrg = async (organizationId: string, assetId: string) => {
  const [record] = await db
    .select({ id: assets.id })
    .from(assets)
    .where(
      and(
        eq(assets.organizationId, organizationId),
        eq(assets.id, assetId),
        isNull(assets.deletedAt),
      ),
    )
    .limit(1);

  if (!record) {
    throw new ValidationError("Validation failed", [
      { path: ["assetId"], message: "Asset not found in this organization" },
    ]);
  }
};

const assertAssigneeInOrg = async (organizationId: string, assignedTo?: string) => {
  if (!assignedTo) return;

  const [record] = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(
      organizationUsers,
      and(
        eq(organizationUsers.userId, users.id),
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.status, "active"),
      ),
    )
    .where(eq(users.id, assignedTo))
    .limit(1);

  if (!record) {
    throw new ValidationError("Validation failed", [
      { path: ["assignedTo"], message: "Assigned user is not an active member of this organization" },
    ]);
  }
};

export const createMaintenanceService = async (
  organizationId: string,
  actorUserId: string,
  payload: CreateMaintenanceInput,
) => {
  await assertAssetExistsInOrg(organizationId, payload.assetId);
  await assertAssigneeInOrg(organizationId, payload.assignedTo);

  const task = await db.transaction(async (tx) => {
    const [record] = await tx
      .insert(maintenanceTasks)
      .values({
        organizationId,
        assetId: payload.assetId,
        title: payload.title,
        description: payload.description ?? null,
        priority: payload.priority,
        dueAt: payload.dueAt ?? null,
        assignedTo: payload.assignedTo ?? null,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      })
      .returning();

    if (!record) throw new ConflictError("Failed to create maintenance task");

    if (record.assignedTo) {
      await tx.insert(notifications).values({
        organizationId,
        userId: record.assignedTo,
        type: "maintenance_due",
        title: "Maintenance task assigned",
        message: `${record.title} has been assigned to you.`,
        metadata: {
          maintenanceId: record.id,
          assetId: record.assetId,
          priority: record.priority,
          dueAt: record.dueAt?.toISOString(),
          redirectUrl: `/maintenance/${record.id}`,
        },
      });
    }

    return record;
  });

  logger.info("Maintenance task created", {
    organizationId,
    actorUserId,
    maintenanceId: task.id,
    assetId: task.assetId,
  });

  return task;
};

export const listMaintenanceService = async (
  organizationId: string,
  query: MaintenanceListQuery,
) => listMaintenanceTasks(organizationId, query);

export const getMaintenanceByIdService = async (organizationId: string, maintenanceId: string) => {
  const record = await findMaintenanceTaskById(organizationId, maintenanceId);
  if (!record) throw new NotFoundError("Maintenance task");
  return record;
};

export const updateMaintenanceService = async (
  organizationId: string,
  maintenanceId: string,
  actorUserId: string,
  payload: UpdateMaintenanceInput,
) => {
  if (payload.assignedTo !== undefined) {
    await assertAssigneeInOrg(organizationId, payload.assignedTo);
  }

  const updated = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(maintenanceTasks)
      .where(
        and(
          eq(maintenanceTasks.organizationId, organizationId),
          eq(maintenanceTasks.id, maintenanceId),
          isNull(maintenanceTasks.deletedAt),
        ),
      )
      .limit(1);

    if (!current) throw new NotFoundError("Maintenance task");

    const updatePayload: Partial<typeof maintenanceTasks.$inferInsert> = {
      updatedByUserId: actorUserId,
      updatedAt: new Date(),
    };

    if (payload.title !== undefined) updatePayload.title = payload.title;
    if (payload.description !== undefined) updatePayload.description = payload.description;
    if (payload.priority !== undefined) updatePayload.priority = payload.priority;
    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.dueAt !== undefined) updatePayload.dueAt = payload.dueAt;
    if (payload.assignedTo !== undefined) updatePayload.assignedTo = payload.assignedTo;

    const [record] = await tx
      .update(maintenanceTasks)
      .set(updatePayload)
      .where(
        and(
          eq(maintenanceTasks.organizationId, organizationId),
          eq(maintenanceTasks.id, maintenanceId),
          isNull(maintenanceTasks.deletedAt),
        ),
      )
      .returning();

    if (!record) throw new NotFoundError("Maintenance task");

    if (record.assignedTo && record.assignedTo !== current.assignedTo) {
      await tx.insert(notifications).values({
        organizationId,
        userId: record.assignedTo,
        type: "maintenance_due",
        title: "Maintenance task assigned",
        message: `${record.title} has been assigned to you.`,
        metadata: {
          maintenanceId: record.id,
          assetId: record.assetId,
          priority: record.priority,
          dueAt: record.dueAt?.toISOString(),
          redirectUrl: `/maintenance/${record.id}`,
        },
      });
    }

    return record;
  });

  logger.info("Maintenance task updated", { organizationId, actorUserId, maintenanceId });
  return updated;
};

export const completeMaintenanceService = async (
  organizationId: string,
  maintenanceId: string,
  actorUserId: string,
  payload: CompleteMaintenanceInput,
) => {
  const completed = await db.transaction(async (tx) => {
    const [record] = await tx
      .update(maintenanceTasks)
      .set({
        status: "completed",
        completedAt: new Date(),
        completedByUserId: actorUserId,
        completionNote: payload.note ?? null,
        updatedByUserId: actorUserId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(maintenanceTasks.organizationId, organizationId),
          eq(maintenanceTasks.id, maintenanceId),
          isNull(maintenanceTasks.deletedAt),
        ),
      )
      .returning();

    if (!record) throw new NotFoundError("Maintenance task");

    if (record.assignedTo) {
      await tx.insert(notifications).values({
        organizationId,
        userId: record.assignedTo,
        type: "maintenance_completed",
        title: "Maintenance task completed",
        message: `${record.title} has been marked as completed.`,
        metadata: {
          maintenanceId: record.id,
          assetId: record.assetId,
          completedByUserId: actorUserId,
          completionNote: payload.note ?? null,
          redirectUrl: `/maintenance/${record.id}`,
        },
      });
    }

    return record;
  });

  logger.info("Maintenance task completed", {
    organizationId,
    actorUserId,
    maintenanceId,
    hasNote: Boolean(payload.note),
  });

  return completed;
};
