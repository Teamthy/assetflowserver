CREATE TYPE "public"."asset_accounting_treatment" AS ENUM('capitalized', 'expensed', 'tracked_non_capitalized', 'pending_review');--> statement-breakpoint
CREATE TYPE "public"."asset_recognition_status" AS ENUM('recognized', 'not_recognized', 'pending_review');--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "has_future_economic_benefit" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "cost_can_be_reliably_measured" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "recognition_status" "asset_recognition_status" DEFAULT 'pending_review' NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "accounting_treatment" "asset_accounting_treatment" DEFAULT 'pending_review' NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "recognition_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "capitalization_threshold_applied" numeric(18, 2);--> statement-breakpoint
CREATE INDEX "assets_org_accounting_treatment_idx" ON "assets" USING btree ("organization_id","accounting_treatment");