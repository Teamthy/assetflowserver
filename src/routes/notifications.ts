import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as notificationsController from "../controllers/notifications";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get(
    "/",
    requirePermission(PERMISSIONS.NOTIFICATION_READ),
    notificationsController.listNotifications
);

notificationsRouter.patch(
    "/:id/read",
    requirePermission(PERMISSIONS.NOTIFICATION_READ),
    notificationsController.markNotificationRead
);

notificationsRouter.patch(
    "/read-all",
    requirePermission(PERMISSIONS.NOTIFICATION_READ),
    notificationsController.markAllNotificationsRead
);