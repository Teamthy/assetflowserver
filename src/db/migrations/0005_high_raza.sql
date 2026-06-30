CREATE TYPE "public"."notification_type" AS ENUM('maintenance_due', 'maintenance_completed', 'asset_assigned', 'asset_transferred', 'approval_required', 'organization_invite', 'password_reset', 'audit_issue', 'system_alert');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" varchar(2000) NOT NULL,
	"type" "notification_type" NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_org_user_created_at_idx" ON "notifications" USING btree ("organization_id","user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_org_user_read_idx" ON "notifications" USING btree ("organization_id","user_id","is_read");