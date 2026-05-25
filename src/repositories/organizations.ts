import { eq } from "drizzle-orm";
import { db } from "../db";
import { organizations } from "../model";

export const findOrganizationById = async (organizationId: string) => {
  const [record] = await db
    .select({
      id: organizations.id,
      multiBranchEnabled: organizations.multiBranchEnabled,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  return record;
};
