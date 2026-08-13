import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AuthenticationError, ValidationError } from "../utils/error";
import {
  getNotificationPreferencesService,
  updateNotificationPreferencesService,
} from "../services/notification-preferences.service";

const preferenceSchema = z.object({
  key: z.string().min(1),
  label: z.string().optional(),
  description: z.string().optional(),
  inApp: z.boolean(),
  email: z.boolean(),
});

const updateSchema = z.object({
  preferences: z.array(preferenceSchema).min(1),
});

export const getNotificationPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.auth?.organizationId || !req.auth.userId) {
      throw new AuthenticationError();
    }

    const data = await getNotificationPreferencesService(
      req.auth.organizationId,
      req.auth.userId,
    );
    res.status(200).json({ success: true, data: { preferences: data } });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.auth?.organizationId || !req.auth.userId) {
      throw new AuthenticationError();
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.issues);
    }

    const data = await updateNotificationPreferencesService({
      organizationId: req.auth.organizationId,
      userId: req.auth.userId,
      preferences: parsed.data.preferences.map((item) => ({
        key: item.key,
        label: item.label ?? item.key,
        description: item.description ?? "",
        inApp: item.inApp,
        email: item.email,
      })),
    });

    res.status(200).json({ success: true, data: { preferences: data } });
  } catch (error) {
    next(error);
  }
};
