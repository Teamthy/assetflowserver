import {
  boolean,
  check,
  index,
  integer,
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
    branchId: uuid("branch_id"),
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
