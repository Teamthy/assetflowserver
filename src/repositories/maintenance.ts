import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { maintenanceTasks } from "../model/maintenance";
import { CreateMaintenanceInput, MaintenanceListQuery, UpdateMaintenanceInput } from "../types/maintenance";

export const createMaintenanceTask = async (
  organizationId: string,
  actorUserId: string,
  payload: CreateMaintenanceInput,
) => {
  const [record] = await db
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

  return record;
};

export const listMaintenanceTasks = async (
  organizationId: string,
  query: MaintenanceListQuery,
) => {
  const filters = [eq(maintenanceTasks.organizationId, organizationId)];
  filters.push(isNull(maintenanceTasks.deletedAt));
  if (query.status) filters.push(eq(maintenanceTasks.status, query.status));
  if (query.assignedTo) filters.push(eq(maintenanceTasks.assignedTo, query.assignedTo));
  if (query.assetId) filters.push(eq(maintenanceTasks.assetId, query.assetId));

  const whereClause = and(...filters)!;
  const offset = (query.page - 1) * query.limit;

  const [totalResult, rows] = await Promise.all([
    db.select({ total: count() }).from(maintenanceTasks).where(whereClause),
    db
      .select()
      .from(maintenanceTasks)
      .where(whereClause)
      .orderBy(desc(maintenanceTasks.createdAt), asc(maintenanceTasks.id))
      .limit(query.limit)
      .offset(offset),
  ]);

  const total = Number(totalResult[0]?.total ?? 0);
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

export const findMaintenanceTaskById = async (organizationId: string, maintenanceId: string) => {
  const [record] = await db
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

  return record;
};

export const updateMaintenanceTaskById = async (
  organizationId: string,
  maintenanceId: string,
  actorUserId: string,
  payload: UpdateMaintenanceInput,
) => {
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

  const [record] = await db
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

  return record;
};

export const completeMaintenanceTaskById = async (
  organizationId: string,
  maintenanceId: string,
  actorUserId: string,
  completionNote?: string,
) => {
  const [record] = await db
    .update(maintenanceTasks)
    .set({
      status: "completed",
      completedAt: new Date(),
      completedByUserId: actorUserId,
      completionNote: completionNote ?? null,
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

  return record;
};
