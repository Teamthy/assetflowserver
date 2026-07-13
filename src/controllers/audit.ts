import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
    completeAuditCampaignSchema,
    createAuditCampaignSchema,
    listAuditCampaignsQuerySchema,
    listVerificationsQuerySchema,
    startAuditCampaignSchema,
    updateAuditCampaignSchema,
    updateVerificationSchema,
} from "../validators/audit";
import {
    completeAuditCampaignService,
    createAuditCampaignService,
    deleteAuditCampaignService,
    getAuditCampaignService,
    listAuditCampaignsService,
    listVerificationsService,
    startAuditCampaignService,
    updateAuditCampaignService,
    updateVerificationService,
} from "../services/audit.service";
import { AuthenticationError, ValidationError } from "../utils/error";

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

export const createCampaign = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const payload = parseData(createAuditCampaignSchema, req.body);
        const data = await createAuditCampaignService({
            organizationId: auth.organizationId,
            createdByUserId: auth.userId,
            payload,
        });
        return res.status(201).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

export const listCampaigns = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const query = parseData(listAuditCampaignsQuerySchema, req.query);
        const data = await listAuditCampaignsService({
            organizationId: auth.organizationId,
            query,
        });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

export const getCampaign = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const campaignId = String(req.params.id);
        const data = await getAuditCampaignService({
            organizationId: auth.organizationId,
            campaignId,
        });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

export const updateCampaign = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const campaignId = String(req.params.id);
        const payload = parseData(updateAuditCampaignSchema, req.body);
        const data = await updateAuditCampaignService({
            organizationId: auth.organizationId,
            campaignId,
            updatedByUserId: auth.userId,
            payload,
        });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

export const deleteCampaign = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const campaignId = String(req.params.id);
        const data = await deleteAuditCampaignService({
            organizationId: auth.organizationId,
            campaignId,
            updatedByUserId: auth.userId,
        });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

export const startCampaign = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const campaignId = String(req.params.id);
        const payload = parseData(startAuditCampaignSchema, req.body ?? {});
        const data = await startAuditCampaignService({
            organizationId: auth.organizationId,
            campaignId,
            updatedByUserId: auth.userId,
            payload,
        });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

export const completeCampaign = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const campaignId = String(req.params.id);
        const payload = parseData(completeAuditCampaignSchema, req.body ?? {});
        const data = await completeAuditCampaignService({
            organizationId: auth.organizationId,
            campaignId,
            updatedByUserId: auth.userId,
            payload,
        });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

export const listVerifications = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const campaignId = String(req.params.id);
        const query = parseData(listVerificationsQuerySchema, req.query);
        const data = await listVerificationsService({
            organizationId: auth.organizationId,
            campaignId,
            query,
        });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};

export const updateVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const campaignId = String(req.params.id);
        const verificationId = String(req.params.verificationId);
        const payload = parseData(updateVerificationSchema, req.body);
        const data = await updateVerificationService({
            organizationId: auth.organizationId,
            campaignId,
            verificationId,
            verifiedByUserId: auth.userId,
            payload,
        });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return next(error);
    }
};