import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as branchesService from "../services/branches";
import { AuthenticationError, ValidationError } from "../utils/error";
import {
  branchParamsSchema,
  createBranchSchema,
  updateBranchSchema,
} from "../validators/branches";

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

export const createBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const payload = parseData(createBranchSchema, req.body);
    const data = await branchesService.createBranchService(
      auth.organizationId,
      auth.userId,
      payload,
    );
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listBranches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const data = await branchesService.listBranchesService(auth.organizationId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getBranchById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(branchParamsSchema, req.params);
    const data = await branchesService.getBranchByIdService(
      auth.organizationId,
      params.id,
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(branchParamsSchema, req.params);
    const payload = parseData(updateBranchSchema, req.body);
    const data = await branchesService.updateBranchService(
      auth.organizationId,
      params.id,
      auth.userId,
      payload,
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(branchParamsSchema, req.params);
    const data = await branchesService.deleteBranchService(
      auth.organizationId,
      params.id,
      auth.userId,
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
