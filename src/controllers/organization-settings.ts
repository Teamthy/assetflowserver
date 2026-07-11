import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as settingsService from "../services/organization-settings.service";
import { updateOrganizationSettingsSchema } from "../validators/organization-settings";
import { AuthenticationError, ValidationError } from "../utils/error";

const parseBody = <T>(schema: z.ZodType<T>, body: unknown): T => {
    const result = schema.safeParse(body);
    if (!result.success) {
        throw new ValidationError("Validation failed", result.error.issues);
    }
    return result.data;
};

const requireAuthContext = (req: Request) => {
    if (!req.auth?.userId || !req.auth?.organizationId) {
        throw new AuthenticationError();
    }
    return {
        userId: req.auth.userId,
        organizationId: req.auth.organizationId,
    };
};

export const getSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const data = await settingsService.getOrCreateOrganizationSettings({
            organizationId: auth.organizationId,
            createdByUserId: auth.userId,
        });
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const updateSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const payload = parseBody(updateOrganizationSettingsSchema, req.body);

        const data = await settingsService.updateOrganizationSettings({
            organizationId: auth.organizationId,
            updatedByUserId: auth.userId,
            updates: payload,
        });

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};