import { NextFunction, Request, Response } from "express";
import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import {
  assetAuditQuerySchema,
  assetLifecycleQuerySchema,
  assetListQuerySchema,
  assetParamsSchema,
  createAssetSchema,
  disposeAssetSchema,
  exportAssetsQuerySchema,
  recordAssetDepreciationSchema,
  restoreAssetSchema,
  transferAssetSchema,
  updateAssetSchema,
} from "../validators/assets";
import * as assetsService from "../services/assets";
import { getAssetsAuditSummary } from "../services/assets.audit.service";
import { exportAssetsWorkbook } from "../services/assets.export.service";
import { importAssetsFromExcelFile } from "../services/assets.import.service";
import { AuthenticationError, ValidationError } from "../utils/error";
import { z } from "zod";

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

export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const payload = parseData(createAssetSchema, req.body);
    const data = await assetsService.createAssetService(auth.organizationId, auth.userId, payload);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listAssets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const query = parseData(assetListQuerySchema, req.query);
    const data = await assetsService.listAssetsService(auth.organizationId, query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAssetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(assetParamsSchema, req.params);
    const data = await assetsService.getAssetByIdService(auth.organizationId, params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(assetParamsSchema, req.params);
    const payload = parseData(updateAssetSchema, req.body);
    const data = await assetsService.updateAssetService(auth.organizationId, params.id, auth.userId, payload);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(assetParamsSchema, req.params);
    const data = await assetsService.deleteAssetService(auth.organizationId, params.id, auth.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const transferAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(assetParamsSchema, req.params);
    const payload = parseData(transferAssetSchema, req.body);
    const data = await assetsService.transferAssetService(auth.organizationId, params.id, auth.userId, payload);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const disposeAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(assetParamsSchema, req.params);
    const payload = parseData(disposeAssetSchema, req.body);
    const data = await assetsService.disposeAssetService(
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

export const restoreAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(assetParamsSchema, req.params);
    const payload = parseData(restoreAssetSchema, req.body);
    const data = await assetsService.restoreAssetService(
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

export const recordAssetDepreciation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(assetParamsSchema, req.params);
    const payload = parseData(recordAssetDepreciationSchema, req.body);
    const data = await assetsService.recordAssetDepreciationService(
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

export const getAssetTimeline = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth = requireAuthContext(req);
    const params = parseData(assetParamsSchema, req.params);
    const query = parseData(assetLifecycleQuerySchema, req.query);
    const data = await assetsService.getAssetTimelineService(
      auth.organizationId,
      params.id,
      query,
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAssetsAudit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const query = parseData(assetAuditQuerySchema, req.query);
    const data = await getAssetsAuditSummary(auth.organizationId, query.includeDeleted);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const exportAssets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const query = parseData(exportAssetsQuerySchema, req.query);
    const exportFile = await exportAssetsWorkbook(auth.organizationId, query);
    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      void unlink(exportFile.filePath).catch(() => undefined);
    };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${exportFile.fileName}`);
    res.on("finish", cleanup);
    res.on("close", cleanup);

    const stream = createReadStream(exportFile.filePath);
    stream.on("error", (error) => {
      cleanup();
      next(error);
    });
    res.status(200);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const importAssets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = requireAuthContext(req);
    const file = req.file;
    if (!file?.path) {
      throw new ValidationError("No file uploaded", []);
    }

    try {
      const data = await importAssetsFromExcelFile(auth.organizationId, auth.userId, file.path);
      res.status(200).json({ success: true, data });
    } finally {
      await unlink(file.path).catch(() => undefined);
    }
  } catch (error) {
    next(error);
  }
};
