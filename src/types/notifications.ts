import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { notifications } from "../model/notification";
import { notificationParamsSchema, notificationsQuerySchema } from "../validators/notifications";
import { z } from "zod";

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;

export type NotificationsQuery = z.infer<typeof notificationsQuerySchema>;
export type NotificationParams = z.infer<typeof notificationParamsSchema>;

export type NotificationListResponse = {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
};
