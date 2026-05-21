import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./user";

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    code: varchar("code", { length: 80 }),
    description: text("description"),
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
    branchesOrgNameUq: uniqueIndex("branches_org_name_uq").on(
      table.organizationId,
      table.name,
    ),
    branchesOrgCodeUq: uniqueIndex("branches_org_code_uq").on(
      table.organizationId,
      table.code,
    ),
    branchesOrgDeletedAtIdx: index("branches_org_deleted_at_idx").on(
      table.organizationId,
      table.deletedAt,
    ),
  }),
);
