CREATE TYPE "public"."asset_disposal_method" AS ENUM('sold', 'donated', 'scrapped', 'lost', 'written_off', 'other');--> statement-breakpoint
CREATE TYPE "public"."asset_lifecycle_event_type" AS ENUM('registered', 'updated', 'assigned', 'transferred', 'status_changed', 'maintenance_scheduled', 'maintenance_started', 'maintenance_completed', 'disposed', 'deleted', 'restored', 'depreciation_recorded');--> statement-breakpoint
CREATE TABLE "asset_disposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"method" "asset_disposal_method" NOT NULL,
	"reason" text NOT NULL,
	"proceeds" numeric(18, 2) DEFAULT '0' NOT NULL,
	"disposed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disposed_by_user_id" uuid NOT NULL,
	"approved_by_user_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_disposals_proceeds_non_negative_chk" CHECK ("asset_disposals"."proceeds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "asset_lifecycle_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"event_type" "asset_lifecycle_event_type" NOT NULL,
	"previous_status" "asset_status",
	"new_status" "asset_status",
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"actor_user_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_disposals" ADD CONSTRAINT "asset_disposals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_disposals" ADD CONSTRAINT "asset_disposals_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_disposals" ADD CONSTRAINT "asset_disposals_disposed_by_user_id_users_id_fk" FOREIGN KEY ("disposed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_disposals" ADD CONSTRAINT "asset_disposals_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_lifecycle_events" ADD CONSTRAINT "asset_lifecycle_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_lifecycle_events" ADD CONSTRAINT "asset_lifecycle_events_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_lifecycle_events" ADD CONSTRAINT "asset_lifecycle_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_disposals_org_asset_idx" ON "asset_disposals" USING btree ("organization_id","asset_id");--> statement-breakpoint
CREATE INDEX "asset_disposals_org_date_idx" ON "asset_disposals" USING btree ("organization_id","disposed_at");--> statement-breakpoint
CREATE INDEX "asset_lifecycle_org_asset_date_idx" ON "asset_lifecycle_events" USING btree ("organization_id","asset_id","occurred_at");--> statement-breakpoint
CREATE INDEX "asset_lifecycle_org_type_date_idx" ON "asset_lifecycle_events" USING btree ("organization_id","event_type","occurred_at");