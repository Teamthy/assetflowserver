ALTER TABLE "maintenance_tasks" ADD COLUMN "completed_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD COLUMN "completion_note" text;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_completed_by_user_id_users_id_fk" FOREIGN KEY ("completed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "maintenance_org_deleted_at_idx" ON "maintenance_tasks" USING btree ("organization_id","deleted_at");