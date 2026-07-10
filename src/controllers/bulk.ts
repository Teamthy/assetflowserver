import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  bulkDeleteAssetsSchema,
  bulkTransferAssetsSchema,
  bulkUpdateStatusSchema,
} from "../validators/assets";
import {
  bulkDeleteAssetsService,
  bulkTransferAssetsService,
  bulkUpdateStatusService,
} from "../services/bulk.service";
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

// ─── Bulk Delete ──────────────────────────────────────────────────────────────

export const bulkDeleteAssets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = requireAuthContext(req);
    const payload = parseData(bulkDeleteAssetsSchema, req.body);

    const result = await bulkDeleteAssetsService({
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      assetIds: payload.assetIds,
      reason: payload.reason,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Bulk Transfer ────────────────────────────────────────────────────────────

export const bulkTransferAssets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = requireAuthContext(req);
    const payload = parseData(bulkTransferAssetsSchema, req.body);

    const result = await bulkTransferAssetsService({
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      assetIds: payload.assetIds,
      toBranchId: payload.toBranchId,
      toUserId: payload.toUserId,
      reason: payload.reason,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Bulk Update Status ───────────────────────────────────────────────────────

export const bulkUpdateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = requireAuthContext(req);
    const payload = parseData(bulkUpdateStatusSchema, req.body);

    const result = await bulkUpdateStatusService({
      organizationId: auth.organizationId,
      actorUserId: auth.userId,
      assetIds: payload.assetIds,
      status: payload.status as "active" | "maintenance",
      reason: payload.reason,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};