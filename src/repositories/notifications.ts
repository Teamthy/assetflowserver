import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "../db";
import { notifications } from "../model/notification";
import {
  organizations,
  organizationUsers,
  roles,
  userRoles,
  users,
} from "../model/user";
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

export const findNotificationRecipient = async (userId: string) => {
  const [record] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return record;
};

export const findOrganizationAdminRecipients = async (organizationId: string) => {
  return db
    .selectDistinct({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .innerJoin(
      organizations,
      eq(organizations.id, organizationId),
    )
    .innerJoin(
      organizationUsers,
      and(
        eq(organizationUsers.userId, users.id),
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.status, "active"),
      ),
    )
    .leftJoin(
      userRoles,
      and(
        eq(userRoles.userId, users.id),
        eq(userRoles.organizationId, organizationId),
      ),
    )
    .leftJoin(roles, eq(roles.id, userRoles.roleId))
    .where(
      and(
        eq(organizationUsers.organizationId, organizationId),
        or(
          eq(roles.name, "admin"),
          eq(organizations.ownerUserId, users.id),
        ),
      ),
    );
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

  const [[countResult], rows] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        unreadCount: sql<number>`count(*) filter (where ${notifications.isRead} = false)`,
      })
      .from(notifications)
      .where(baseFilter),
    db
      .select()
      .from(notifications)
      .where(filter)
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(query.limit)
      .offset(offset),
  ]);

  const total = Number(countResult?.total ?? 0);
  const unreadCount = Number(countResult?.unreadCount ?? 0);
  const filteredTotal = query.unreadOnly ? unreadCount : total;

  return {
    data: rows,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: filteredTotal,
      totalPages: Math.max(1, Math.ceil(filteredTotal / query.limit)),
      unreadCount,
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
  const result = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
      ),
    );

  return { updated: result.rowCount ?? 0 };
};
