import { and, eq, gt, isNull, lte } from "drizzle-orm";
import { db } from "../db";
import { assets, organizations } from "../model";

/**
 * Get all active organizations.
 * Used by scheduler jobs to fan out across all orgs.
 */
export async function getActiveOrganizations(): Promise<
    { id: string; name: string }[]
> {
    const rows = await db
        .select({
            id: organizations.id,
            name: organizations.name,
        })
        .from(organizations)
        .where(
            and(
                eq(organizations.isActive, true),
                isNull(organizations.deletedAt)
            )
        );

    return rows;
}

/**
 * Get all active assets with warranty expiring within the next N days.
 * Used by the warranty expiry scheduler job.
 */
export async function getAssetsWithExpiringWarranties(
    organizationId: string,
    daysAhead: number
): Promise<
    {
        id: string;
        name: string;
        assetTag: string;
        warrantyExpiryDate: Date;
        organizationId: string;
    }[]
> {
    const now = new Date();
    const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const rows = await db
        .select({
            id: assets.id,
            name: assets.name,
            assetTag: assets.assetTag,
            warrantyExpiryDate: assets.warrantyExpiryDate,
            organizationId: assets.organizationId,
        })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt),
                // Warranty exists
                gt(assets.warrantyExpiryDate, now),
                // Warranty expires within daysAhead
                lte(assets.warrantyExpiryDate, until)
            )
        );

    // Filter out null warrantyExpiryDate at type level
    return rows.filter(
        (r): r is typeof r & { warrantyExpiryDate: Date } =>
            r.warrantyExpiryDate !== null
    );
}