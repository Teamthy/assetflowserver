CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"code" varchar(80),
	"description" text,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "branches_org_name_uq" ON "branches" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "branches_org_code_uq" ON "branches" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "branches_org_deleted_at_idx" ON "branches" USING btree ("organization_id","deleted_at");--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;