import {
  createNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../repositories/notifications";
import { NotificationsQuery } from "../types/notifications";
import { NotFoundError } from "../utils/error";

export const createInAppNotification = createNotification;

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
  await markAllNotificationsRead(organizationId, userId);
  return { message: "All notifications marked as read" };
};
