import { NextFunction, Request, Response } from "express";
import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { z } from "zod";
import {
    listDocumentsQuerySchema,
    uploadDocumentSchema,
} from "../validators/documents";
import {
    deleteDocumentService,
    getDocumentDownloadService,
    listDocumentsService,
    uploadDocumentService,
} from "../services/documents.service";
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

// ─── Upload Document ──────────────────────────────────────────────────────────

export const uploadDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);

        if (!req.file) {
            throw new ValidationError("Validation failed", [
                { path: ["file"], message: "No file uploaded" },
            ]);
        }

        const payload = parseData(uploadDocumentSchema, req.body);

        const document = await uploadDocumentService({
            organizationId: auth.organizationId,
            uploadedByUserId: auth.userId,
            file: req.file,
            payload,
        });

        return res.status(201).json({ success: true, data: document });
    } catch (error) {
        // Clean up temp file if error occurred
        if (req.file?.path) {
            await unlink(req.file.path).catch(() => undefined);
        }
        return next(error);
    }
};

// ─── Download Document ────────────────────────────────────────────────────────

export const downloadDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const documentId = String(req.params.id);

        const { document, absolutePath } = await getDocumentDownloadService(
            auth.organizationId,
            documentId
        );

        res.setHeader("Content-Type", document.mimeType);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${document.originalFileName}"`
        );
        res.setHeader("Content-Length", document.fileSize);

        const stream = createReadStream(absolutePath);
        stream.on("error", (error) => next(error));
        stream.pipe(res);
    } catch (error) {
        return next(error);
    }
};

// ─── List Documents ───────────────────────────────────────────────────────────

export const listDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const query = parseData(listDocumentsQuerySchema, req.query);

        const result = await listDocumentsService(auth.organizationId, query);

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return next(error);
    }
};

// ─── Get Document Metadata ────────────────────────────────────────────────────

export const getDocumentMetadata = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const documentId = String(req.params.id);

        const { document } = await getDocumentDownloadService(
            auth.organizationId,
            documentId
        );

        return res.status(200).json({
            success: true,
            data: {
                id: document.id,
                entityType: document.entityType,
                entityId: document.entityId,
                category: document.category,
                fileName: document.fileName,
                originalFileName: document.originalFileName,
                mimeType: document.mimeType,
                fileSize: document.fileSize,
                description: document.description,
                uploadedByUserId: document.uploadedByUserId,
                createdAt: document.createdAt,
            },
        });
    } catch (error) {
        return next(error);
    }
};

// ─── Delete Document ──────────────────────────────────────────────────────────

export const deleteDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const auth = requireAuthContext(req);
        const documentId = String(req.params.id);

        const result = await deleteDocumentService(
            auth.organizationId,
            documentId,
            auth.userId
        );

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return next(error);
    }
};