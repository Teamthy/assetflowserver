import { boolean, index, jsonb, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organizations, users } from "./user";

export const notificationTypeEnum = pgEnum("notification_type", [
  "maintenance_due",
  "maintenance_scheduled",
  "maintenance_completed",
  "asset_assigned",
  "asset_transferred",
  "asset_updated",
  "asset_deleted",
  "asset_disposed",
  "warranty_expiring",
  "depreciation_completed",
  "branch_created",
  "branch_updated",
  "approval_required",
  "organization_invite",
  "password_reset",
  "audit_issue",
  "system_alert",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    message: varchar("message", { length: 2000 }).notNull(),
    type: notificationTypeEnum("type").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => ({
	    notificationsOrgUserCreatedAtIdx: index("notifications_org_user_created_at_idx").on(
	      table.organizationId,
	      table.userId,
	      table.createdAt,
	    ),
	    notificationsOrgUserCreatedAtIdIdx: index("notifications_org_user_created_at_id_idx").on(
	      table.organizationId,
	      table.userId,
	      table.createdAt,
	      table.id,
	    ),
	    notificationsOrgUserReadIdx: index("notifications_org_user_read_idx").on(
	      table.organizationId,
	      table.userId,
	      table.isRead,
	    ),
	    notificationsOrgUserUnreadCreatedAtIdx: index("notifications_org_user_unread_created_at_idx")
	      .on(table.organizationId, table.userId, table.createdAt, table.id)
	      .where(sql`${table.isRead} = false`),
	  }),
	);
