import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { notifications } from "../model/notification";
import { NotificationsQuery } from "../types/notifications";

export const createNotification = async (input: {
  organizationId: string;
  userId: string;
  title: string;
  message: string;
  type: typeof notifications.$inferInsert.type;
  metadata?: Record<string, unknown>;
}) => {
  const [record] = await db
    .insert(notifications)
    .values({
      organizationId: input.organizationId,
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      metadata: input.metadata ?? {},
    })
    .returning();

  return record;
};

export const listNotifications = async (
  organizationId: string,
  userId: string,
  query: NotificationsQuery,
) => {
  const offset = (query.page - 1) * query.limit;
  const baseFilter = and(
    eq(notifications.organizationId, organizationId),
    eq(notifications.userId, userId),
  )!;

  const unreadFilter = and(baseFilter, eq(notifications.isRead, false))!;
  const filter = query.unreadOnly ? unreadFilter : baseFilter;

  const [totalResult, unreadResult, rows] = await Promise.all([
    db.select({ total: count() }).from(notifications).where(filter),
    db.select({ total: count() }).from(notifications).where(unreadFilter),
    db
      .select()
      .from(notifications)
      .where(filter)
      .orderBy(desc(notifications.createdAt))
      .limit(query.limit)
      .offset(offset),
  ]);

  return {
    data: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: Number(totalResult[0]?.total ?? 0),
      totalPages: Math.max(1, Math.ceil(Number(totalResult[0]?.total ?? 0) / query.limit)),
      unreadCount: Number(unreadResult[0]?.total ?? 0),
    },
  };
};

export const markNotificationRead = async (
  organizationId: string,
  userId: string,
  notificationId: string,
) => {
  const [record] = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId),
      ),
    )
    .returning();

  return record;
};

export const markAllNotificationsRead = async (organizationId: string, userId: string) => {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
      ),
    );
};
