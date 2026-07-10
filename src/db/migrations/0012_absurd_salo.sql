CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."approval_type" AS ENUM('disposal', 'transfer');--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"type" "approval_type" NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"approved_by_user_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"requester_notes" text,
	"approver_notes" text,
	"decided_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approvals_org_status_idx" ON "approvals" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "approvals_org_asset_idx" ON "approvals" USING btree ("organization_id","asset_id");--> statement-breakpoint
CREATE INDEX "approvals_org_type_idx" ON "approvals" USING btree ("organization_id","type");--> statement-breakpoint
CREATE INDEX "asset_lifecycle_org_asset_date_id_idx" ON "asset_lifecycle_events" USING btree ("organization_id","asset_id","occurred_at","id");--> statement-breakpoint
CREATE INDEX "assets_org_created_at_idx" ON "assets" USING btree ("organization_id","created_at","id") WHERE "assets"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "assets_org_purchase_date_idx" ON "assets" USING btree ("organization_id","purchase_date","id") WHERE "assets"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "assets_org_warranty_expiry_idx" ON "assets" USING btree ("organization_id","warranty_expiry_date","id") WHERE "assets"."deleted_at" IS NULL AND "assets"."warranty_expiry_date" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "assets_org_assigned_to_idx" ON "assets" USING btree ("organization_id","assigned_to") WHERE "assets"."deleted_at" IS NULL AND "assets"."assigned_to" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "notifications_org_user_created_at_id_idx" ON "notifications" USING btree ("organization_id","user_id","created_at","id");--> statement-breakpoint
CREATE INDEX "notifications_org_user_unread_created_at_idx" ON "notifications" USING btree ("organization_id","user_id","created_at","id") WHERE "notifications"."is_read" = false;--> statement-breakpoint
CREATE INDEX "maintenance_org_created_at_idx" ON "maintenance_tasks" USING btree ("organization_id","created_at","id") WHERE "maintenance_tasks"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "maintenance_org_status_created_at_idx" ON "maintenance_tasks" USING btree ("organization_id","status","created_at","id") WHERE "maintenance_tasks"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "maintenance_org_assigned_to_idx" ON "maintenance_tasks" USING btree ("organization_id","assigned_to") WHERE "maintenance_tasks"."deleted_at" IS NULL AND "maintenance_tasks"."assigned_to" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "maintenance_org_due_open_idx" ON "maintenance_tasks" USING btree ("organization_id","due_at","id") WHERE "maintenance_tasks"."deleted_at" IS NULL AND "maintenance_tasks"."status" IN ('open', 'in_progress');