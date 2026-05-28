import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { db } from "../db";
import { assets } from "../model/asset";
import { maintenanceTasks } from "../model/maintenance";
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
import { createInAppNotification } from "./notifications";

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

    return record;
  });

  logger.info("Maintenance task created", {
    organizationId,
    actorUserId,
    maintenanceId: task.id,
    assetId: task.assetId,
  });

  if (task.assignedTo) {
    await createInAppNotification({
      organizationId,
      userId: task.assignedTo,
      type: "maintenance_scheduled",
      title: "Maintenance scheduled",
      message: `${task.title} has been scheduled and assigned to you.`,
      metadata: {
        maintenanceId: task.id,
        assetId: task.assetId,
        priority: task.priority,
        dueAt: task.dueAt?.toISOString(),
        redirectUrl: `/maintenance/${task.id}`,
      },
    });
  }

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

    return record;
  });

  logger.info("Maintenance task updated", { organizationId, actorUserId, maintenanceId });
  if (updated.assignedTo) {
    await createInAppNotification({
      organizationId,
      userId: updated.assignedTo,
      type: "maintenance_scheduled",
      title: "Maintenance task updated",
      message: `${updated.title} has been updated.`,
      metadata: {
        maintenanceId: updated.id,
        assetId: updated.assetId,
        priority: updated.priority,
        dueAt: updated.dueAt?.toISOString(),
        redirectUrl: `/maintenance/${updated.id}`,
      },
    });
  }
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

    return record;
  });

  logger.info("Maintenance task completed", {
    organizationId,
    actorUserId,
    maintenanceId,
    hasNote: Boolean(payload.note),
  });

  if (completed.assignedTo) {
    await createInAppNotification({
      organizationId,
      userId: completed.assignedTo,
      type: "maintenance_completed",
      title: "Maintenance task completed",
      message: `${completed.title} has been marked as completed.`,
      metadata: {
        maintenanceId: completed.id,
        assetId: completed.assetId,
        completedByUserId: actorUserId,
        completionNote: payload.note ?? null,
        redirectUrl: `/maintenance/${completed.id}`,
      },
    });
  }

  return completed;
};

export const notifyMaintenanceDueSoonService = async (
  organizationId: string,
  daysAhead = 7,
) => {
  const now = new Date();
  const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const tasks = await db
    .select()
    .from(maintenanceTasks)
    .where(
      and(
        eq(maintenanceTasks.organizationId, organizationId),
        isNull(maintenanceTasks.deletedAt),
        gte(maintenanceTasks.dueAt, now),
        lte(maintenanceTasks.dueAt, until),
      ),
    );

  await Promise.all(
    tasks
      .filter((task) => Boolean(task.assignedTo))
      .map((task) =>
        createInAppNotification({
          organizationId,
          userId: task.assignedTo!,
          type: "maintenance_due",
          title: "Maintenance due soon",
          message: `${task.title} is due soon.`,
          metadata: {
            maintenanceId: task.id,
            assetId: task.assetId,
            priority: task.priority,
            dueAt: task.dueAt?.toISOString(),
            redirectUrl: `/maintenance/${task.id}`,
          },
        }),
      ),
  );

  return { notified: tasks.filter((task) => Boolean(task.assignedTo)).length };
};
