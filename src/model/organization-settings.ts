import {
    integer,
    numeric,
    pgEnum,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { organizations, users } from "./user";

import { depreciationMethodEnum } from "./asset";
export const lowValueTreatmentEnum = pgEnum("low_value_treatment", [
    "track_non_capitalized",
    "expense",
]);





export const organizationSettings = pgTable(
    "organization_settings",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        organizationId: uuid("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),



        capitalizationThreshold: numeric("capitalization_threshold", {
            precision: 14,
            scale: 2,
        })
            .notNull()
            .default("50000.00"),

        capitalizationCurrency: varchar("capitalization_currency", { length: 3 })
            .notNull()
            .default("NGN"),


        minimumUsefulLifeMonths: integer("minimum_useful_life_months")
            .notNull()
            .default(12),

        lowValueTreatment: lowValueTreatmentEnum("low_value_treatment")
            .notNull()
            .default("track_non_capitalized"),


        defaultDepreciationMethod: depreciationMethodEnum(
            "default_depreciation_method",
        )
            .notNull()
            .default("straight_line"),


        defaultUsefulLifeYears: integer("default_useful_life_years"),


        createdByUserId: uuid("created_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        updatedByUserId: uuid("updated_by_user_id").references(() => users.id, {
            onDelete: "set null",
        }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => ({

        orgSettingsOrgUq: uniqueIndex("organization_settings_org_uq").on(
            table.organizationId,
        ),
    }),
);