import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  completeMaintenanceSchema,
  createMaintenanceSchema,
  maintenanceListQuerySchema,
  maintenanceParamsSchema,
  updateMaintenanceSchema,
} from "../validators/maintenance";
import {
  completeMaintenanceService,
  createMaintenanceService,
  getMaintenanceByIdService,
  listMaintenanceService,
  updateMaintenanceService,
} from "../services/maintenance";
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

export const createMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const payload = parseData(createMaintenanceSchema, req.body);
    const data = await createMaintenanceService(auth.organizationId, auth.userId, payload);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const query = parseData(maintenanceListQuerySchema, req.query);
    const data = await listMaintenanceService(auth.organizationId, query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(maintenanceParamsSchema, req.params);
    const data = await getMaintenanceByIdService(auth.organizationId, params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(maintenanceParamsSchema, req.params);
    const payload = parseData(updateMaintenanceSchema, req.body);
    const data = await updateMaintenanceService(auth.organizationId, params.id, auth.userId, payload);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const completeMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(maintenanceParamsSchema, req.params);
    const payload = parseData(completeMaintenanceSchema, req.body ?? {});
    const data = await completeMaintenanceService(auth.organizationId, params.id, auth.userId, payload);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
