DROP INDEX "branches_org_name_uq";--> statement-breakpoint
DROP INDEX "branches_org_code_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "branches_org_name_uq" ON "branches" USING btree ("organization_id","name") WHERE "branches"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "branches_org_code_uq" ON "branches" USING btree ("organization_id","code") WHERE "branches"."deleted_at" IS NULL AND "branches"."code" IS NOT NULL;