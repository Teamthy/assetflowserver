import {
    index,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./user";
import { assets } from "./asset";

export const approvalTypeEnum = pgEnum("approval_type", [
    "disposal",
    "transfer",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
    "pending",
    "approved",
    "rejected",
]);

export const approvals = pgTable(
    "approvals",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        organizationId: uuid("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),
        assetId: uuid("asset_id")
            .notNull()
            .references(() => assets.id, { onDelete: "cascade" }),
        type: approvalTypeEnum("type").notNull(),
        status: approvalStatusEnum("status").notNull().default("pending"),
        requestedByUserId: uuid("requested_by_user_id")
            .notNull()
            .references(() => users.id, { onDelete: "restrict" }),
        approvedByUserId: uuid("approved_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        payload: jsonb("payload")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),
        requesterNotes: text("requester_notes"),
        approverNotes: text("approver_notes"),
        decidedAt: timestamp("decided_at", { withTimezone: true }),
        expiresAt: timestamp("expires_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        approvalsOrgStatusIdx: index("approvals_org_status_idx").on(
            table.organizationId,
            table.status
        ),
        approvalsOrgAssetIdx: index("approvals_org_asset_idx").on(
            table.organizationId,
            table.assetId
        ),
        approvalsOrgTypeIdx: index("approvals_org_type_idx").on(
            table.organizationId,
            table.type
        ),
    })
);