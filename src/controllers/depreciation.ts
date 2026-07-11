import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
    depreciationScheduleQuerySchema,
    previewAssetDepreciationSchema,
    runDepreciationBatchSchema,
} from "../validators/depreciation";
import {
    getDepreciationScheduleService,
    previewAssetDepreciationService,
    runDepreciationBatchService,
} from "../services/depreciation.batch.service";
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

// ─── Preview Asset Depreciation ───────────────────────────────────────────────

export const previewAssetDepreciation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const assetId = String(req.params.assetId);
        const query = parseData(previewAssetDepreciationSchema, req.query);

        const result = await previewAssetDepreciationService({
            organizationId: auth.organizationId,
            assetId,
            fiscalYear: query.fiscalYear,
            method: query.method,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return next(error);
    }
};

// ─── Run Batch Depreciation ───────────────────────────────────────────────────

export const runDepreciationBatch = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const payload = parseData(runDepreciationBatchSchema, req.body);

        const result = await runDepreciationBatchService({
            organizationId: auth.organizationId,
            actorUserId: auth.userId,
            fiscalYear: payload.fiscalYear,
            method: payload.method,
            runDate: payload.runDate,
            assetIds: payload.assetIds,
            dryRun: payload.dryRun,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return next(error);
    }
};

// ─── Get Depreciation Schedule ────────────────────────────────────────────────

export const getDepreciationSchedule = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const query = parseData(depreciationScheduleQuerySchema, req.query);

        const result = await getDepreciationScheduleService({
            organizationId: auth.organizationId,
            fiscalYear: query.fiscalYear,
            page: query.page,
            limit: query.limit,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return next(error);
    }
};