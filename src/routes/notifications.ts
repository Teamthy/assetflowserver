import { Router } from "express";
import * as notificationsController from "../controllers/notifications";
import * as notificationPreferencesController from "../controllers/notification-preferences";
import { requireAuth } from "../middlewares/auth";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.get("/stream", notificationsController.streamNotifications);
notificationsRouter.get("/preferences", notificationPreferencesController.getNotificationPreferences);
notificationsRouter.patch("/preferences", notificationPreferencesController.updateNotificationPreferences);
notificationsRouter.get("/", notificationsController.listNotifications);
notificationsRouter.patch("/read-all", notificationsController.markAllNotificationsRead);
notificationsRouter.patch("/:id/read", notificationsController.markNotificationRead);
