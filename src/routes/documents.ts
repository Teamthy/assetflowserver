import { Router } from "express";
import multer from "multer";
import os from "node:os";
import { env } from "../config/env";
import { PERMISSIONS } from "../config/permissions";
import * as documentsController from "../controllers/documents";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";
import { uploadRateLimit } from "../middlewares/rateLimit";

const upload = multer({
    storage: multer.diskStorage({
        destination: os.tmpdir(),
    }),
    limits: {
        fileSize: env.MAX_FILE_SIZE_BYTES,
        files: 1,
    },
});

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

// ─── Upload Document ──────────────────────────────────────────────────────────
documentsRouter.post(
    "/",
    uploadRateLimit,
    requirePermission(PERMISSIONS.ASSET_UPDATE),
    upload.single("file"),
    documentsController.uploadDocument
);

// ─── List Documents ───────────────────────────────────────────────────────────
documentsRouter.get(
    "/",
    requirePermission(PERMISSIONS.ASSET_READ),
    documentsController.listDocuments
);

// ─── Get Document Metadata ────────────────────────────────────────────────────
documentsRouter.get(
    "/:id",
    requirePermission(PERMISSIONS.ASSET_READ),
    documentsController.getDocumentMetadata
);

// ─── Download Document ────────────────────────────────────────────────────────
documentsRouter.get(
    "/:id/download",
    requirePermission(PERMISSIONS.ASSET_READ),
    documentsController.downloadDocument
);

// ─── Delete Document ──────────────────────────────────────────────────────────
documentsRouter.delete(
    "/:id",
    requirePermission(PERMISSIONS.ASSET_UPDATE),
    documentsController.deleteDocument
);