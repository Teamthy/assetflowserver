CREATE TYPE "public"."low_value_treatment" AS ENUM('track_non_capitalized', 'expense');--> statement-breakpoint
CREATE TABLE "organization_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "organization_id" uuid NOT NULL,
        "capitalization_threshold" numeric(14, 2) DEFAULT '50000.00' NOT NULL,
        "capitalization_currency" varchar(3) DEFAULT 'NGN' NOT NULL,
        "minimum_useful_life_months" integer DEFAULT 12 NOT NULL,
        "low_value_treatment" "low_value_treatment" DEFAULT 'track_non_capitalized' NOT NULL,
        "default_depreciation_method" "depreciation_method" DEFAULT 'straight_line' NOT NULL,
        "default_useful_life_years" integer,
        "created_by_user_id" uuid,
        "updated_by_user_id" uuid,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_settings_org_uq" ON "organization_settings" USING btree ("organization_id");