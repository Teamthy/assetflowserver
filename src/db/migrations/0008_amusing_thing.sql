ALTER TYPE "public"."notification_type" ADD VALUE 'maintenance_scheduled' BEFORE 'maintenance_completed';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'asset_updated' BEFORE 'approval_required';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'asset_deleted' BEFORE 'approval_required';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'asset_disposed' BEFORE 'approval_required';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'warranty_expiring' BEFORE 'approval_required';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'depreciation_completed' BEFORE 'approval_required';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'branch_created' BEFORE 'approval_required';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'branch_updated' BEFORE 'approval_required';