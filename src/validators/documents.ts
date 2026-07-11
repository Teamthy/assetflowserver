import { z } from "zod";

export const uploadDocumentSchema = z.object({
    entityType: z.enum([
        "asset",
        "maintenance",
        "disposal",
        "approval",
        "audit",
        "general",
    ]),
    entityId: z.string().uuid("Invalid entity ID"),
    category: z
        .enum([
            "invoice",
            "warranty",
            "photo",
            "receipt",
            "contract",
            "manual",
            "maintenance_evidence",
            "disposal_approval",
            "audit_evidence",
            "other",
        ])
        .default("other"),
    description: z.string().trim().max(2000).optional(),
});

export const listDocumentsQuerySchema = z.object({
    entityType: z
        .enum([
            "asset",
            "maintenance",
            "disposal",
            "approval",
            "audit",
            "general",
        ])
        .optional(),
    entityId: z.string().uuid().optional(),
    category: z
        .enum([
            "invoice",
            "warranty",
            "photo",
            "receipt",
            "contract",
            "manual",
            "maintenance_evidence",
            "disposal_approval",
            "audit_evidence",
            "other",
        ])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;