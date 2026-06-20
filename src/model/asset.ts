import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organizations, users } from "./user";
import { branches } from "./branch";

export const assetStatusEnum = pgEnum("asset_status", [
  "active",
  "maintenance",
  "disposed",
]);

export const assetConditionEnum = pgEnum("asset_condition", [
  "excellent",
  "good",
  "fair",
  "poor",
]);

export const depreciationMethodEnum = pgEnum("depreciation_method", [
  "straight_line",
  "reducing_balance",
]);

export const assetLifecycleEventTypeEnum = pgEnum("asset_lifecycle_event_type", [
  "registered",
  "updated",
  "assigned",
  "transferred",
  "status_changed",
  "maintenance_scheduled",
  "maintenance_started",
  "maintenance_completed",
  "disposed",
  "deleted",
  "restored",
  "depreciation_recorded",
]);

export const assetDisposalMethodEnum = pgEnum("asset_disposal_method", [
  "sold",
  "donated",
  "scrapped",
  "lost",
  "written_off",
  "other",
]);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description"),
    assetTag: varchar("asset_tag", { length: 120 }).notNull(),
    serialNumber: varchar("serial_number", { length: 160 }),
    category: varchar("category", { length: 120 }),
    manufacturer: varchar("manufacturer", { length: 120 }),
    model: varchar("model", { length: 120 }),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "set null",
    }),
    assignedTo: uuid("assigned_to").references(() => users.id, {
      onDelete: "set null",
    }),
    status: assetStatusEnum("status").notNull().default("active"),
    condition: assetConditionEnum("condition").notNull().default("good"),
    purchaseCost: numeric("purchase_cost", { precision: 18, scale: 2 }).notNull(),
    purchaseDate: timestamp("purchase_date", { withTimezone: true }),
    warrantyExpiryDate: timestamp("warranty_expiry_date", { withTimezone: true }),
    expectedUsefulLifeMonths: integer("expected_useful_life_months"),
    residualValue: numeric("residual_value", { precision: 18, scale: 2 }),
    qrCodeUrl: text("qr_code_url"),
    isDepreciable: boolean("is_depreciable").notNull().default(true),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    assetsOrgAssetTagUq: uniqueIndex("assets_org_asset_tag_uq").on(
      table.organizationId,
      table.assetTag,
    ),
    assetsOrgSerialNumberUq: uniqueIndex("assets_org_serial_number_uq").on(
      table.organizationId,
      table.serialNumber,
    ),
    assetsOrgStatusIdx: index("assets_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
    assetsOrgBranchIdx: index("assets_org_branch_idx").on(
      table.organizationId,
      table.branchId,
    ),
    assetsOrgDeletedAtIdx: index("assets_org_deleted_at_idx").on(
      table.organizationId,
      table.deletedAt,
    ),
    assetsPositivePurchaseCostChk: check(
      "assets_positive_purchase_cost_chk",
      sql`${table.purchaseCost} >= 0`,
    ),
  }),
);

export const assetTransfers = pgTable(
  "asset_transfers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    fromBranchId: uuid("from_branch_id"),
    toBranchId: uuid("to_branch_id"),
    fromUserId: uuid("from_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    toUserId: uuid("to_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reason: text("reason"),
    transferredByUserId: uuid("transferred_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    transferredAt: timestamp("transferred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    transferOrgAssetIdx: index("asset_transfers_org_asset_idx").on(
      table.organizationId,
      table.assetId,
    ),
    transferOrgDateIdx: index("asset_transfers_org_date_idx").on(
      table.organizationId,
      table.transferredAt,
    ),
    transferTargetRequiredChk: check(
      "asset_transfers_target_required_chk",
      sql`${table.toBranchId} IS NOT NULL OR ${table.toUserId} IS NOT NULL`,
    ),
  }),
);

export const assetDepreciationSnapshots = pgTable(
  "asset_depreciation_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    fiscalYear: integer("fiscal_year").notNull(),
    periodUsedPriorYears: integer("period_used_prior_years").notNull().default(0),
    periodUsedCurrentYear: integer("period_used_current_year").notNull().default(0),
    accumulatedDepreciationBf: numeric("accumulated_depreciation_bf", {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default("0"),
    yearlyDepCharge: numeric("yearly_dep_charge", { precision: 18, scale: 2 })
      .notNull()
      .default("0"),
    totalAccumulatedDepreciation: numeric("total_accumulated_depreciation", {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default("0"),
    depreciationMethod: depreciationMethodEnum("depreciation_method")
      .notNull()
      .default("straight_line"),
    runDate: timestamp("run_date", { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    assetDepSnapshotOrgAssetYearUq: uniqueIndex(
      "asset_dep_snapshot_org_asset_year_uq",
    ).on(table.organizationId, table.assetId, table.fiscalYear),
    assetDepSnapshotOrgYearIdx: index("asset_dep_snapshot_org_year_idx").on(
      table.organizationId,
      table.fiscalYear,
    ),
    assetDepSnapshotOrgAssetIdx: index("asset_dep_snapshot_org_asset_idx").on(
      table.organizationId,
      table.assetId,
    ),
    assetDepPriorYearsNonNegativeChk: check(
      "asset_dep_prior_years_non_negative_chk",
      sql`${table.periodUsedPriorYears} >= 0`,
    ),
    assetDepCurrentYearNonNegativeChk: check(
      "asset_dep_current_year_non_negative_chk",
      sql`${table.periodUsedCurrentYear} >= 0`,
    ),
    assetDepAmountsNonNegativeChk: check(
      "asset_dep_amounts_non_negative_chk",
      sql`${table.accumulatedDepreciationBf} >= 0 AND ${table.yearlyDepCharge} >= 0 AND ${table.totalAccumulatedDepreciation} >= 0`,
    ),
  }),
);

export const assetLifecycleEvents = pgTable(
  "asset_lifecycle_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    eventType: assetLifecycleEventTypeEnum("event_type").notNull(),
    previousStatus: assetStatusEnum("previous_status"),
    newStatus: assetStatusEnum("new_status"),
    description: text("description"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    lifecycleOrgAssetDateIdx: index("asset_lifecycle_org_asset_date_idx").on(
      table.organizationId,
      table.assetId,
      table.occurredAt,
    ),
    lifecycleOrgTypeDateIdx: index("asset_lifecycle_org_type_date_idx").on(
      table.organizationId,
      table.eventType,
      table.occurredAt,
    ),
  }),
);

export const assetDisposals = pgTable(
  "asset_disposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    method: assetDisposalMethodEnum("method").notNull(),
    reason: text("reason").notNull(),
    proceeds: numeric("proceeds", { precision: 18, scale: 2 })
      .notNull()
      .default("0"),
    disposedAt: timestamp("disposed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    disposedByUserId: uuid("disposed_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    approvedByUserId: uuid("approved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    disposalOrgAssetIdx: index("asset_disposals_org_asset_idx").on(
      table.organizationId,
      table.assetId,
    ),
    disposalOrgDateIdx: index("asset_disposals_org_date_idx").on(
      table.organizationId,
      table.disposedAt,
    ),
    disposalProceedsNonNegativeChk: check(
      "asset_disposals_proceeds_non_negative_chk",
      sql`${table.proceeds} >= 0`,
    ),
  }),
);
