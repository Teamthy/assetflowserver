import {
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./user";

export const documentEntityTypeEnum = pgEnum("document_entity_type", [
    "asset",
    "maintenance",
    "disposal",
    "approval",
    "audit",
    "general",
]);

export const documentCategoryEnum = pgEnum("document_category", [
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
]);

export const documents = pgTable(
    "documents",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        organizationId: uuid("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),

        // What this document is attached to
        entityType: documentEntityTypeEnum("entity_type").notNull(),
        entityId: uuid("entity_id").notNull(),

        // Document metadata
        category: documentCategoryEnum("category").notNull().default("other"),
        fileName: varchar("file_name", { length: 255 }).notNull(),
        originalFileName: varchar("original_file_name", { length: 255 }).notNull(),
        mimeType: varchar("mime_type", { length: 128 }).notNull(),
        fileSize: integer("file_size").notNull(),
        storagePath: text("storage_path").notNull(),
        storageProvider: varchar("storage_provider", { length: 32 })
            .notNull()
            .default("local"),

        description: text("description"),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),

        uploadedByUserId: uuid("uploaded_by_user_id")
            .notNull()
            .references(() => users.id, { onDelete: "restrict" }),

        deletedAt: timestamp("deleted_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        documentsOrgEntityIdx: index("documents_org_entity_idx").on(
            table.organizationId,
            table.entityType,
            table.entityId
        ),
        documentsOrgCategoryIdx: index("documents_org_category_idx").on(
            table.organizationId,
            table.category
        ),
        documentsOrgUploadedByIdx: index("documents_org_uploaded_by_idx").on(
            table.organizationId,
            table.uploadedByUserId
        ),
    })
);