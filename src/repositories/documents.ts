import { and, count, desc, eq, isNull, SQL } from "drizzle-orm";
import { db } from "../db";
import { documents } from "../model/documents";
import { users } from "../model/user";
import { ListDocumentsQuery } from "../validators/documents";

// ─── Create Document ──────────────────────────────────────────────────────────

export async function createDocument(input: {
    organizationId: string;
    entityType:
    | "asset"
    | "maintenance"
    | "disposal"
    | "approval"
    | "audit"
    | "general";
    entityId: string;
    category:
    | "invoice"
    | "warranty"
    | "photo"
    | "receipt"
    | "contract"
    | "manual"
    | "maintenance_evidence"
    | "disposal_approval"
    | "audit_evidence"
    | "other";
    fileName: string;
    originalFileName: string;
    mimeType: string;
    fileSize: number;
    storagePath: string;
    description?: string;
    uploadedByUserId: string;
}): Promise<typeof documents.$inferSelect> {
    const [record] = await db
        .insert(documents)
        .values({
            organizationId: input.organizationId,
            entityType: input.entityType,
            entityId: input.entityId,
            category: input.category,
            fileName: input.fileName,
            originalFileName: input.originalFileName,
            mimeType: input.mimeType,
            fileSize: input.fileSize,
            storagePath: input.storagePath,
            storageProvider: "local",
            description: input.description ?? null,
            uploadedByUserId: input.uploadedByUserId,
        })
        .returning();

    return record;
}

// ─── Find Document By ID ──────────────────────────────────────────────────────

export async function findDocumentById(
    organizationId: string,
    documentId: string
): Promise<typeof documents.$inferSelect | null> {
    const [record] = await db
        .select()
        .from(documents)
        .where(
            and(
                eq(documents.organizationId, organizationId),
                eq(documents.id, documentId),
                isNull(documents.deletedAt)
            )
        )
        .limit(1);

    return record ?? null;
}

// ─── List Documents ───────────────────────────────────────────────────────────

export async function listDocuments(
    organizationId: string,
    query: ListDocumentsQuery
) {
    const filters: SQL[] = [
        eq(documents.organizationId, organizationId),
        isNull(documents.deletedAt),
    ];

    if (query.entityType) {
        filters.push(eq(documents.entityType, query.entityType));
    }

    if (query.entityId) {
        filters.push(eq(documents.entityId, query.entityId));
    }

    if (query.category) {
        filters.push(eq(documents.category, query.category));
    }

    const whereClause = and(...filters);
    const offset = (query.page - 1) * query.limit;

    const [totalRow] = await db
        .select({ total: count() })
        .from(documents)
        .where(whereClause);

    const rows = await db
        .select({
            id: documents.id,
            entityType: documents.entityType,
            entityId: documents.entityId,
            category: documents.category,
            fileName: documents.fileName,
            originalFileName: documents.originalFileName,
            mimeType: documents.mimeType,
            fileSize: documents.fileSize,
            description: documents.description,
            uploadedByUserId: documents.uploadedByUserId,
            uploaderFirstName: users.firstName,
            uploaderLastName: users.lastName,
            createdAt: documents.createdAt,
        })
        .from(documents)
        .innerJoin(users, eq(documents.uploadedByUserId, users.id))
        .where(whereClause)
        .orderBy(desc(documents.createdAt))
        .limit(query.limit)
        .offset(offset);

    const total = Number(totalRow?.total ?? 0);

    return {
        data: rows,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / query.limit)),
        },
    };
}

// ─── Soft Delete Document ─────────────────────────────────────────────────────

export async function softDeleteDocument(
    organizationId: string,
    documentId: string
): Promise<typeof documents.$inferSelect | null> {
    const [record] = await db
        .update(documents)
        .set({
            deletedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(documents.organizationId, organizationId),
                eq(documents.id, documentId),
                isNull(documents.deletedAt)
            )
        )
        .returning();

    return record ?? null;
}