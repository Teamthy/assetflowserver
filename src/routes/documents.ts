import { Router } from "express";
import multer from "multer";
import os from "node:os";
import { env } from "../config/env";
import { PERMISSIONS } from "../config/permissions";
import * as documentsController from "../controllers/documents";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";
import { requireNotReadOnly } from "../middlewares/scope";
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
// Admin, Asset Manager, Finance, Branch Manager (own branch), Maintenance Staff
documentsRouter.post(
    "/",
    uploadRateLimit,
    requirePermission(PERMISSIONS.DOCUMENT_UPLOAD),
    requireNotReadOnly,
    upload.single("file"),
    documentsController.uploadDocument
);

// ─── List Documents ───────────────────────────────────────────────────────────
// Anyone with DOCUMENT_UPLOAD can list — filter by entityType/entityId in query
documentsRouter.get(
    "/",
    requirePermission(PERMISSIONS.DOCUMENT_UPLOAD),
    documentsController.listDocuments
);

// ─── Get Document Metadata ────────────────────────────────────────────────────
documentsRouter.get(
    "/:id",
    requirePermission(PERMISSIONS.DOCUMENT_UPLOAD),
    documentsController.getDocumentMetadata
);

// ─── Download Document ────────────────────────────────────────────────────────
documentsRouter.get(
    "/:id/download",
    requirePermission(PERMISSIONS.DOCUMENT_UPLOAD),
    documentsController.downloadDocument
);

// ─── Delete Document ──────────────────────────────────────────────────────────
// Admin, Asset Manager only
documentsRouter.delete(
    "/:id",
    requirePermission(PERMISSIONS.DOCUMENT_DELETE),
    requireNotReadOnly,
    documentsController.deleteDocument
);