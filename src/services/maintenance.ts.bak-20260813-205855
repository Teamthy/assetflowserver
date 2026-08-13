import { and, eq, gte, isNull, lte, ne, or } from "drizzle-orm";
import { db } from "../db";
import { assetLifecycleEvents, assets } from "../model/asset";
import { maintenanceTasks } from "../model/maintenance";
import { organizationUsers, users } from "../model/user";
import {
  findMaintenanceTaskById,
  listMaintenanceTasks,
} from "../repositories/maintenance";
import {
  recordAssetLifecycleEvent,
  transitionAssetStatus,
} from "../repositories/assets";
import {
  CompleteMaintenanceInput,
  CreateMaintenanceInput,
  MaintenanceListQuery,
  UpdateMaintenanceInput,
} from "../types/maintenance";
import { ConflictError, NotFoundError, ValidationError } from "../utils/error";
import { logger } from "../utils/logger";
import { createInAppNotification } from "./notifications";

const NOTIFICATION_BATCH_CONCURRENCY = 10;

const runWithConcurrency = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) => {
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        if (item === undefined) continue;
        await worker(item);
      }
    },
  );

  await Promise.all(workers);
};

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

const assertAssigneeInOrg = async (
  organizationId: string,
  assignedTo?: string | null,
) => {
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

    await tx.insert(assetLifecycleEvents).values({
      organizationId,
      assetId: record.assetId,
      eventType: "maintenance_scheduled",
      description: record.title,
      metadata: {
        maintenanceId: record.id,
        priority: record.priority,
        dueAt: record.dueAt?.toISOString(),
        assignedTo: record.assignedTo,
      },
      actorUserId,
    });

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
  if (payload.status === "completed") {
    throw new ValidationError("Validation failed", [
      {
        path: ["status"],
        message: "Use the maintenance completion endpoint to complete a task",
      },
    ]);
  }

  if (payload.assignedTo !== undefined) {
    await assertAssigneeInOrg(organizationId, payload.assignedTo);
  }

  const { updated, previousStatus, shouldRestoreActive } = await db.transaction(async (tx) => {
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
    const previousStatus = current.status;

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
          eq(maintenanceTasks.status, current.status),
        ),
      )
      .returning();

    if (!record) {
      throw new ConflictError("Maintenance task was modified concurrently");
    }

    let shouldRestoreActive = false;
    if (
      current.status === "in_progress" &&
      payload.status &&
      ["open", "cancelled"].includes(payload.status)
    ) {
      const [otherInProgress] = await tx
        .select({ id: maintenanceTasks.id })
        .from(maintenanceTasks)
        .where(
          and(
            eq(maintenanceTasks.organizationId, organizationId),
            eq(maintenanceTasks.assetId, record.assetId),
            eq(maintenanceTasks.status, "in_progress"),
            ne(maintenanceTasks.id, record.id),
            isNull(maintenanceTasks.deletedAt),
          ),
        )
        .limit(1);

      shouldRestoreActive = !otherInProgress;
    }

    return { updated: record, previousStatus, shouldRestoreActive };
  });

  logger.info("Maintenance task updated", { organizationId, actorUserId, maintenanceId });

  if (payload.status === "in_progress" && previousStatus !== "in_progress") {
    await transitionAssetStatus(
      organizationId,
      updated.assetId,
      actorUserId,
      "maintenance",
      "maintenance_started",
      `Maintenance started: ${updated.title}`,
      { maintenanceId: updated.id },
    );
  }

  if (shouldRestoreActive) {
    await transitionAssetStatus(
      organizationId,
      updated.assetId,
      actorUserId,
      "active",
      "status_changed",
      `Maintenance ${payload.status}: ${updated.title}`,
      { maintenanceId: updated.id },
    );
  }

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
  const { completed, wasInProgress, otherInProgress } = await db.transaction(async (tx) => {
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
    if (current.status === "completed") {
      throw new ConflictError("Maintenance task is already completed");
    }
    if (current.status === "cancelled") {
      throw new ConflictError("Cannot complete a cancelled maintenance task");
    }

    const completedAt = new Date();
    const [record] = await tx
      .update(maintenanceTasks)
      .set({
        status: "completed",
        completedAt,
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
          eq(maintenanceTasks.status, current.status),
        ),
      )
      .returning();

    if (!record) {
      throw new ConflictError("Maintenance task was modified concurrently");
    }

    let otherInProgress = false;
    if (current.status === "in_progress") {
      const [sibling] = await tx
        .select({ id: maintenanceTasks.id })
        .from(maintenanceTasks)
        .where(
          and(
            eq(maintenanceTasks.organizationId, organizationId),
            eq(maintenanceTasks.assetId, record.assetId),
            eq(maintenanceTasks.status, "in_progress"),
            ne(maintenanceTasks.id, record.id),
            isNull(maintenanceTasks.deletedAt),
          ),
        )
        .limit(1);
      otherInProgress = Boolean(sibling);
    }

    return {
      completed: record,
      wasInProgress: current.status === "in_progress",
      otherInProgress,
    };
  });

  logger.info("Maintenance task completed", {
    organizationId,
    actorUserId,
    maintenanceId,
    hasNote: Boolean(payload.note),
  });

  if (wasInProgress) {
    await transitionAssetStatus(
      organizationId,
      completed.assetId,
      actorUserId,
      otherInProgress ? "maintenance" : "active",
      "maintenance_completed",
      `Maintenance completed: ${completed.title}`,
      {
        maintenanceId: completed.id,
        completionNote: payload.note ?? null,
        otherMaintenanceInProgress: otherInProgress,
      },
    );
  } else {
    await recordAssetLifecycleEvent({
      organizationId,
      assetId: completed.assetId,
      actorUserId,
      eventType: "maintenance_completed",
      description: `Maintenance completed: ${completed.title}`,
      metadata: {
        maintenanceId: completed.id,
        completionNote: payload.note ?? null,
        completedFromStatus: "open",
      },
      occurredAt: completed.completedAt ?? new Date(),
    });
  }

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
        or(
          eq(maintenanceTasks.status, "open"),
          eq(maintenanceTasks.status, "in_progress"),
        ),
      ),
    );

  const assignedTasks = tasks.filter((task) => Boolean(task.assignedTo));
  await runWithConcurrency(
    assignedTasks,
    NOTIFICATION_BATCH_CONCURRENCY,
    async (task) => {
      await createInAppNotification({
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
      });
    },
  );

  return { notified: assignedTasks.length };
};
