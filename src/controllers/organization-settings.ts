import { NextFunction, Request, Response } from "express";
import * as settingsService from "../services/organization-settings.service";
import { updateOrganizationSettingsSchema } from "../validators/organization-settings";
import { getAuthenticatedContext, parseRequestData } from "../utils/controller";

export const getSettings = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = getAuthenticatedContext(req);
        const data = await settingsService.getOrCreateOrganizationSettings({
            organizationId: auth.organizationId,
            createdByUserId: auth.userId,
        });
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getOnboardingStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const auth = getAuthenticatedContext(req);
        const data = await settingsService.getOrganizationOnboardingStatus(auth.organizationId);
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
        const auth = getAuthenticatedContext(req);
        const payload = parseRequestData(updateOrganizationSettingsSchema, req.body);

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