import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  markAllNotificationsReadService,
  markNotificationReadService,
  listNotificationsService,
} from "../services/notifications";
import { AuthenticationError, ValidationError } from "../utils/error";
import { notificationParamsSchema, notificationsQuerySchema } from "../validators/notifications";

const parseData = <T>(schema: z.ZodType<T>, payload: unknown): T => {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues);
  }
  return parsed.data;
};

const requireAuthContext = (req: Request) => {
  if (!req.auth?.organizationId || !req.auth?.userId) {
    throw new AuthenticationError();
  }
  return {
    organizationId: req.auth.organizationId,
    userId: req.auth.userId,
  };
};

export const listNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const query = parseData(notificationsQuerySchema, req.query);
    const data = await listNotificationsService(auth.organizationId, auth.userId, query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(notificationParamsSchema, req.params);
    const data = await markNotificationReadService(auth.organizationId, auth.userId, params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth = requireAuthContext(req);
    const data = await markAllNotificationsReadService(auth.organizationId, auth.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
