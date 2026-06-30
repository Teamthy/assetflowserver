import { index, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { organizations, users } from "./user";
import { assets } from "./asset";

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "open",
  "in_progress",
  "completed",
  "cancelled",
]);

export const maintenancePriorityEnum = pgEnum("maintenance_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const maintenanceTasks = pgTable(
  "maintenance_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    status: maintenanceStatusEnum("status").notNull().default("open"),
    priority: maintenancePriorityEnum("priority").notNull().default("medium"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedByUserId: uuid("completed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    completionNote: text("completion_note"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    maintenanceOrgStatusIdx: index("maintenance_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
    maintenanceOrgDueAtIdx: index("maintenance_org_due_at_idx").on(
      table.organizationId,
      table.dueAt,
    ),
    maintenanceOrgAssetIdx: index("maintenance_org_asset_idx").on(
      table.organizationId,
      table.assetId,
    ),
    maintenanceOrgDeletedAtIdx: index("maintenance_org_deleted_at_idx").on(
      table.organizationId,
      table.deletedAt,
    ),
  }),
);
