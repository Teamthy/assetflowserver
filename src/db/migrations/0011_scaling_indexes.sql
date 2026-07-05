CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_org_created_at_idx" ON "assets" USING btree ("organization_id","created_at","id") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_org_purchase_date_idx" ON "assets" USING btree ("organization_id","purchase_date","id") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_org_warranty_expiry_idx" ON "assets" USING btree ("organization_id","warranty_expiry_date","id") WHERE "deleted_at" IS NULL AND "warranty_expiry_date" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_org_assigned_to_idx" ON "assets" USING btree ("organization_id","assigned_to") WHERE "deleted_at" IS NULL AND "assigned_to" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_search_trgm_idx" ON "assets" USING gin ((name || ' ' || asset_tag || ' ' || coalesce(serial_number, '') || ' ' || coalesce(description, '')) gin_trgm_ops) WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "asset_lifecycle_org_asset_date_id_idx" ON "asset_lifecycle_events" USING btree ("organization_id","asset_id","occurred_at","id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_org_created_at_idx" ON "maintenance_tasks" USING btree ("organization_id","created_at","id") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_org_status_created_at_idx" ON "maintenance_tasks" USING btree ("organization_id","status","created_at","id") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_org_assigned_to_idx" ON "maintenance_tasks" USING btree ("organization_id","assigned_to") WHERE "deleted_at" IS NULL AND "assigned_to" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "maintenance_org_due_open_idx" ON "maintenance_tasks" USING btree ("organization_id","due_at","id") WHERE "deleted_at" IS NULL AND "status" IN ('open', 'in_progress');--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_org_user_created_at_id_idx" ON "notifications" USING btree ("organization_id","user_id","created_at","id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_org_user_unread_created_at_idx" ON "notifications" USING btree ("organization_id","user_id","created_at","id") WHERE "is_read" = false;
