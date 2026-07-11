import {
    index,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./user";
import { assets } from "./asset";
import { branches } from "./branch";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const auditCampaignStatusEnum = pgEnum("audit_campaign_status", [
    "draft",
    "in_progress",
    "completed",
    "cancelled",
]);

export const auditVerificationStatusEnum = pgEnum("audit_verification_status", [
    "pending",
    "found",
    "missing",
    "damaged",
    "moved",
    "unknown",
]);

// ─── Audit Campaigns ──────────────────────────────────────────────────────────

export const auditCampaigns = pgTable(
    "audit_campaigns",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        organizationId: uuid("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),

        name: varchar("name", { length: 200 }).notNull(),
        description: text("description"),
        status: auditCampaignStatusEnum("status").notNull().default("draft"),

        // Scope: null branchId = all branches
        branchId: uuid("branch_id").references(() => branches.id, {
            onDelete: "set null",
        }),

        // Assigned auditor
        auditorUserId: uuid("auditor_user_id").references(() => users.id, {
            onDelete: "set null",
        }),

        // Campaign schedule
        scheduledStartDate: timestamp("scheduled_start_date", {
            withTimezone: true,
        }),
        scheduledEndDate: timestamp("scheduled_end_date", { withTimezone: true }),
        startedAt: timestamp("started_at", { withTimezone: true }),
        completedAt: timestamp("completed_at", { withTimezone: true }),

        // Metrics captured at completion
        totalAssetsExpected: text("total_assets_expected"),
        totalVerified: text("total_verified"),
        totalMissing: text("total_missing"),
        totalDamaged: text("total_damaged"),

        notes: text("notes"),
        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),

        createdByUserId: uuid("created_by_user_id")
            .notNull()
            .references(() => users.id, { onDelete: "restrict" }),
        updatedByUserId: uuid("updated_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),

        deletedAt: timestamp("deleted_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        auditCampaignsOrgStatusIdx: index("audit_campaigns_org_status_idx").on(
            table.organizationId,
            table.status
        ),
        auditCampaignsOrgAuditorIdx: index("audit_campaigns_org_auditor_idx").on(
            table.organizationId,
            table.auditorUserId
        ),
        auditCampaignsOrgBranchIdx: index("audit_campaigns_org_branch_idx").on(
            table.organizationId,
            table.branchId
        ),
    })
);

// ─── Audit Verifications ──────────────────────────────────────────────────────

export const auditVerifications = pgTable(
    "audit_verifications",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        organizationId: uuid("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),

        campaignId: uuid("campaign_id")
            .notNull()
            .references(() => auditCampaigns.id, { onDelete: "cascade" }),
        assetId: uuid("asset_id")
            .notNull()
            .references(() => assets.id, { onDelete: "cascade" }),

        status: auditVerificationStatusEnum("status").notNull().default("pending"),

        // Verification details
        verifiedByUserId: uuid("verified_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        verifiedAt: timestamp("verified_at", { withTimezone: true }),

        // Findings
        findings: text("findings"),
        conditionAtVerification: varchar("condition_at_verification", {
            length: 32,
        }),
        locationAtVerification: text("location_at_verification"),

        // Remediation tracking
        remediationRequired: text("remediation_required"),
        remediationCompletedAt: timestamp("remediation_completed_at", {
            withTimezone: true,
        }),
        remediationCompletedByUserId: uuid("remediation_completed_by_user_id").references(
            () => users.id,
            { onDelete: "set null" }
        ),

        metadata: jsonb("metadata")
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),

        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        auditVerificationsCampaignAssetIdx: index(
            "audit_verifications_campaign_asset_idx"
        ).on(table.campaignId, table.assetId),
        auditVerificationsOrgStatusIdx: index(
            "audit_verifications_org_status_idx"
        ).on(table.organizationId, table.status),
        auditVerificationsCampaignStatusIdx: index(
            "audit_verifications_campaign_status_idx"
        ).on(table.campaignId, table.status),
    })
);