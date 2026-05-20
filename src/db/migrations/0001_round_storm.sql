CREATE TYPE "public"."asset_condition" AS ENUM('excellent', 'good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('active', 'maintenance', 'disposed');--> statement-breakpoint
CREATE TYPE "public"."depreciation_method" AS ENUM('straight_line', 'reducing_balance');--> statement-breakpoint
CREATE TABLE "asset_depreciation_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"fiscal_year" integer NOT NULL,
	"period_used_prior_years" integer DEFAULT 0 NOT NULL,
	"period_used_current_year" integer DEFAULT 0 NOT NULL,
	"accumulated_depreciation_bf" numeric(18, 2) DEFAULT '0' NOT NULL,
	"yearly_dep_charge" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_accumulated_depreciation" numeric(18, 2) DEFAULT '0' NOT NULL,
	"depreciation_method" "depreciation_method" DEFAULT 'straight_line' NOT NULL,
	"run_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_dep_prior_years_non_negative_chk" CHECK ("asset_depreciation_snapshots"."period_used_prior_years" >= 0),
	CONSTRAINT "asset_dep_current_year_non_negative_chk" CHECK ("asset_depreciation_snapshots"."period_used_current_year" >= 0),
	CONSTRAINT "asset_dep_amounts_non_negative_chk" CHECK ("asset_depreciation_snapshots"."accumulated_depreciation_bf" >= 0 AND "asset_depreciation_snapshots"."yearly_dep_charge" >= 0 AND "asset_depreciation_snapshots"."total_accumulated_depreciation" >= 0)
);
--> statement-breakpoint
CREATE TABLE "asset_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"from_branch_id" uuid,
	"to_branch_id" uuid,
	"from_user_id" uuid,
	"to_user_id" uuid,
	"reason" text,
	"transferred_by_user_id" uuid NOT NULL,
	"transferred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_transfers_target_required_chk" CHECK ("asset_transfers"."to_branch_id" IS NOT NULL OR "asset_transfers"."to_user_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"description" text,
	"asset_tag" varchar(120) NOT NULL,
	"serial_number" varchar(160),
	"category" varchar(120),
	"manufacturer" varchar(120),
	"model" varchar(120),
	"branch_id" uuid,
	"assigned_to" uuid,
	"status" "asset_status" DEFAULT 'active' NOT NULL,
	"condition" "asset_condition" DEFAULT 'good' NOT NULL,
	"purchase_cost" numeric(18, 2) NOT NULL,
	"purchase_date" timestamp with time zone,
	"warranty_expiry_date" timestamp with time zone,
	"expected_useful_life_months" integer,
	"residual_value" numeric(18, 2),
	"qr_code_url" text,
	"is_depreciable" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_positive_purchase_cost_chk" CHECK ("assets"."purchase_cost" >= 0)
);
--> statement-breakpoint
ALTER TABLE "asset_depreciation_snapshots" ADD CONSTRAINT "asset_depreciation_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_depreciation_snapshots" ADD CONSTRAINT "asset_depreciation_snapshots_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_depreciation_snapshots" ADD CONSTRAINT "asset_depreciation_snapshots_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_transferred_by_user_id_users_id_fk" FOREIGN KEY ("transferred_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "asset_dep_snapshot_org_asset_year_uq" ON "asset_depreciation_snapshots" USING btree ("organization_id","asset_id","fiscal_year");--> statement-breakpoint
CREATE INDEX "asset_dep_snapshot_org_year_idx" ON "asset_depreciation_snapshots" USING btree ("organization_id","fiscal_year");--> statement-breakpoint
CREATE INDEX "asset_dep_snapshot_org_asset_idx" ON "asset_depreciation_snapshots" USING btree ("organization_id","asset_id");--> statement-breakpoint
CREATE INDEX "asset_transfers_org_asset_idx" ON "asset_transfers" USING btree ("organization_id","asset_id");--> statement-breakpoint
CREATE INDEX "asset_transfers_org_date_idx" ON "asset_transfers" USING btree ("organization_id","transferred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_org_asset_tag_uq" ON "assets" USING btree ("organization_id","asset_tag");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_org_serial_number_uq" ON "assets" USING btree ("organization_id","serial_number");--> statement-breakpoint
CREATE INDEX "assets_org_status_idx" ON "assets" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "assets_org_branch_idx" ON "assets" USING btree ("organization_id","branch_id");--> statement-breakpoint
CREATE INDEX "assets_org_deleted_at_idx" ON "assets" USING btree ("organization_id","deleted_at");