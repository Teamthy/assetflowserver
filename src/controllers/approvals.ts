import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  approveDisposalSchema,
  approveTransferSchema,
  requestDisposalApprovalSchema,
  requestTransferApprovalSchema,
} from "../validators/assets";
import {
  decideDisposalApprovalService,
  decideTransferApprovalService,
  listAssetApprovalsService,
  listPendingApprovalsService,
  requestDisposalApprovalService,
  requestTransferApprovalService,
} from "../services/approvals.service";
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

// ─── Request Disposal Approval ────────────────────────────────────────────────

export const requestDisposalApproval = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = requireAuthContext(req);
    const assetId = String(req.params.assetId);
    const payload = parseData(requestDisposalApprovalSchema, req.body);

    const result = await requestDisposalApprovalService({
      organizationId: auth.organizationId,
      assetId,
      requestedByUserId: auth.userId,
      ...payload,
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

// ─── Request Transfer Approval ────────────────────────────────────────────────

export const requestTransferApproval = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = requireAuthContext(req);
    const assetId = String(req.params.assetId);
    const payload = parseData(requestTransferApprovalSchema, req.body);

    const result = await requestTransferApprovalService({
      organizationId: auth.organizationId,
      assetId,
      requestedByUserId: auth.userId,
      ...payload,
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

// ─── Decide Disposal Approval ─────────────────────────────────────────────────

export const decideDisposalApproval = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = requireAuthContext(req);
    const approvalId = String(req.params.approvalId);
    const payload = parseData(approveDisposalSchema, req.body);

    const result = await decideDisposalApprovalService({
      organizationId: auth.organizationId,
      approvalId,
      approverUserId: auth.userId,
      approved: payload.approved,
      notes: payload.notes,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

// ─── Decide Transfer Approval ─────────────────────────────────────────────────

export const decideTransferApproval = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = requireAuthContext(req);
    const approvalId = String(req.params.approvalId);
    const payload = parseData(approveTransferSchema, req.body);

    const result = await decideTransferApprovalService({
      organizationId: auth.organizationId,
      approvalId,
      approverUserId: auth.userId,
      approved: payload.approved,
      notes: payload.notes,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

// ─── List Pending Approvals ───────────────────────────────────────────────────

export const listPendingApprovals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = requireAuthContext(req);
    const type = req.query.type as "disposal" | "transfer" | undefined;

    const result = await listPendingApprovalsService(
      auth.organizationId,
      type
    );

    return res.status(200).json({
      success: true,
      data: result,
      total: result.length,
    });
  } catch (error) {
    return next(error);
  }
};

// ─── List Asset Approvals ─────────────────────────────────────────────────────

export const listAssetApprovals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = requireAuthContext(req);
    const assetId = String(req.params.assetId);

    const result = await listAssetApprovalsService(
      auth.organizationId,
      assetId
    );

    return res.status(200).json({
      success: true,
      data: result,
      total: result.length,
    });
  } catch (error) {
    return next(error);
  }
};