CREATE TYPE "public"."low_value_treatment" AS ENUM('track_non_capitalized', 'expense');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."approval_type" AS ENUM('disposal', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('invoice', 'warranty', 'photo', 'receipt', 'contract', 'manual', 'maintenance_evidence', 'disposal_approval', 'audit_evidence', 'other');--> statement-breakpoint
CREATE TYPE "public"."document_entity_type" AS ENUM('asset', 'maintenance', 'disposal', 'approval', 'audit', 'general');--> statement-breakpoint
CREATE TYPE "public"."audit_campaign_status" AS ENUM('draft', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."audit_verification_status" AS ENUM('pending', 'found', 'missing', 'damaged', 'moved', 'unknown');--> statement-breakpoint
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
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" "document_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"category" "document_category" DEFAULT 'other' NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"mime_type" varchar(128) NOT NULL,
	"file_size" integer NOT NULL,
	"storage_path" text NOT NULL,
	"storage_provider" varchar(32) DEFAULT 'local' NOT NULL,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"status" "audit_campaign_status" DEFAULT 'draft' NOT NULL,
	"branch_id" uuid,
	"auditor_user_id" uuid,
	"scheduled_start_date" timestamp with time zone,
	"scheduled_end_date" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"total_assets_expected" text,
	"total_verified" text,
	"total_missing" text,
	"total_damaged" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"status" "audit_verification_status" DEFAULT 'pending' NOT NULL,
	"verified_by_user_id" uuid,
	"verified_at" timestamp with time zone,
	"findings" text,
	"condition_at_verification" varchar(32),
	"location_at_verification" text,
	"remediation_required" text,
	"remediation_completed_at" timestamp with time zone,
	"remediation_completed_by_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_campaigns" ADD CONSTRAINT "audit_campaigns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_campaigns" ADD CONSTRAINT "audit_campaigns_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_campaigns" ADD CONSTRAINT "audit_campaigns_auditor_user_id_users_id_fk" FOREIGN KEY ("auditor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_campaigns" ADD CONSTRAINT "audit_campaigns_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_campaigns" ADD CONSTRAINT "audit_campaigns_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_verifications" ADD CONSTRAINT "audit_verifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_verifications" ADD CONSTRAINT "audit_verifications_campaign_id_audit_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."audit_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_verifications" ADD CONSTRAINT "audit_verifications_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_verifications" ADD CONSTRAINT "audit_verifications_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_verifications" ADD CONSTRAINT "audit_verifications_remediation_completed_by_user_id_users_id_fk" FOREIGN KEY ("remediation_completed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_settings_org_uq" ON "organization_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "approvals_org_status_idx" ON "approvals" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "approvals_org_asset_idx" ON "approvals" USING btree ("organization_id","asset_id");--> statement-breakpoint
CREATE INDEX "approvals_org_type_idx" ON "approvals" USING btree ("organization_id","type");--> statement-breakpoint
CREATE INDEX "documents_org_entity_idx" ON "documents" USING btree ("organization_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "documents_org_category_idx" ON "documents" USING btree ("organization_id","category");--> statement-breakpoint
CREATE INDEX "documents_org_uploaded_by_idx" ON "documents" USING btree ("organization_id","uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "audit_campaigns_org_status_idx" ON "audit_campaigns" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "audit_campaigns_org_auditor_idx" ON "audit_campaigns" USING btree ("organization_id","auditor_user_id");--> statement-breakpoint
CREATE INDEX "audit_campaigns_org_branch_idx" ON "audit_campaigns" USING btree ("organization_id","branch_id");--> statement-breakpoint
CREATE INDEX "audit_verifications_campaign_asset_idx" ON "audit_verifications" USING btree ("campaign_id","asset_id");--> statement-breakpoint
CREATE INDEX "audit_verifications_org_status_idx" ON "audit_verifications" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "audit_verifications_campaign_status_idx" ON "audit_verifications" USING btree ("campaign_id","status");--> statement-breakpoint
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