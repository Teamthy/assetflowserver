import {
  createNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../repositories/notifications";
import { NotificationsQuery } from "../types/notifications";
import { NotFoundError } from "../utils/error";
import { logger } from "../utils/logger";

export const createInAppNotification = async (input: Parameters<typeof createNotification>[0]) => {
  try {
    return await createNotification(input);
  } catch (error) {
    logger.error("Failed to create notification", {
      organizationId: input.organizationId,
      userId: input.userId,
      type: input.type,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

export const listNotificationsService = async (
  organizationId: string,
  userId: string,
  query: NotificationsQuery,
) => listNotifications(organizationId, userId, query);

export const markNotificationReadService = async (
  organizationId: string,
  userId: string,
  notificationId: string,
) => {
  const record = await markNotificationRead(organizationId, userId, notificationId);
  if (!record) throw new NotFoundError("Notification");
  return record;
};

export const markAllNotificationsReadService = async (
  organizationId: string,
  userId: string,
) => {
  return markAllNotificationsRead(organizationId, userId);
};
