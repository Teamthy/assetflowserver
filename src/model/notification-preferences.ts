import { jsonb, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations, users } from "./user";

export type StoredNotificationPreference = {
  key: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
};

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    preferences: jsonb("preferences")
      .$type<StoredNotificationPreference[]>()
      .notNull()
      .default([]),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.organizationId, table.userId] }),
  }),
);
