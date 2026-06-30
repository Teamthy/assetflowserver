import { Router } from "express";
import * as notificationsController from "../controllers/notifications";
import { requireAuth } from "../middlewares/auth";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.get("/", notificationsController.listNotifications);
notificationsRouter.patch("/:id/read", notificationsController.markNotificationRead);
notificationsRouter.patch("/read-all", notificationsController.markAllNotificationsRead);
