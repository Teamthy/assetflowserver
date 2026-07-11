import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import {
    assets,
    assetDepreciationSnapshots,
    assetLifecycleEvents,
} from "../model/asset";
import { logger } from "../utils/logger";

/**
 * Get all depreciable assets eligible for a depreciation run.
 * An asset is eligible if:
 * - it's capitalized
 * - it's marked isDepreciable
 * - it's not deleted
 * - it's not disposed
 * - it has purchase cost, purchase date, and useful life
 */
export async function getDepreciableAssets(
    organizationId: string,
    assetIds?: string[]
) {
    const filters = [
        eq(assets.organizationId, organizationId),
        eq(assets.accountingTreatment, "capitalized"),
        eq(assets.isDepreciable, true),
        isNull(assets.deletedAt),
        sql`${assets.status} != 'disposed'`,
        sql`${assets.purchaseDate} IS NOT NULL`,
        sql`${assets.expectedUsefulLifeMonths} IS NOT NULL`,
    ];

    if (assetIds && assetIds.length > 0) {
        filters.push(inArray(assets.id, assetIds));
    }

    return db
        .select({
            id: assets.id,
            name: assets.name,
            assetTag: assets.assetTag,
            purchaseCost: assets.purchaseCost,
            residualValue: assets.residualValue,
            purchaseDate: assets.purchaseDate,
            expectedUsefulLifeMonths: assets.expectedUsefulLifeMonths,
            status: assets.status,
        })
        .from(assets)
        .where(and(...filters));
}

/**
 * Get the most recent depreciation snapshot for an asset (any year).
 * Used to calculate periodUsedPriorYears and accumulatedDepreciationBf.
 */
export async function getLatestSnapshotBeforeYear(
    organizationId: string,
    assetId: string,
    fiscalYear: number
) {
    const rows = await db
        .select()
        .from(assetDepreciationSnapshots)
        .where(
            and(
                eq(assetDepreciationSnapshots.organizationId, organizationId),
                eq(assetDepreciationSnapshots.assetId, assetId),
                sql`${assetDepreciationSnapshots.fiscalYear} < ${fiscalYear}`
            )
        )
        .orderBy(desc(assetDepreciationSnapshots.fiscalYear))
        .limit(1);

    return rows[0] ?? null;
}

/**
 * Bulk upsert depreciation snapshots.
 * Wrapped in a transaction with lifecycle event insertions.
 */
export async function bulkUpsertDepreciationSnapshots(input: {
    organizationId: string;
    actorUserId: string;
    snapshots: Array<{
        assetId: string;
        fiscalYear: number;
        periodUsedPriorYears: number;
        periodUsedCurrentYear: number;
        accumulatedDepreciationBf: number;
        yearlyDepCharge: number;
        totalAccumulatedDepreciation: number;
        depreciationMethod: "straight_line" | "reducing_balance";
        runDate: Date;
        assetStatus: "active" | "maintenance" | "disposed";
    }>;
}): Promise<{
    inserted: number;
    updated: number;
}> {
    const { organizationId, actorUserId, snapshots } = input;

    if (snapshots.length === 0) {
        return { inserted: 0, updated: 0 };
    }

    let insertedCount = 0;

    await db.transaction(async (tx) => {
        for (const s of snapshots) {
            await tx
                .insert(assetDepreciationSnapshots)
                .values({
                    organizationId,
                    assetId: s.assetId,
                    fiscalYear: s.fiscalYear,
                    periodUsedPriorYears: s.periodUsedPriorYears,
                    periodUsedCurrentYear: s.periodUsedCurrentYear,
                    accumulatedDepreciationBf: String(s.accumulatedDepreciationBf),
                    yearlyDepCharge: String(s.yearlyDepCharge),
                    totalAccumulatedDepreciation: String(s.totalAccumulatedDepreciation),
                    depreciationMethod: s.depreciationMethod,
                    runDate: s.runDate,
                    createdByUserId: actorUserId,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [
                        assetDepreciationSnapshots.organizationId,
                        assetDepreciationSnapshots.assetId,
                        assetDepreciationSnapshots.fiscalYear,
                    ],
                    set: {
                        periodUsedPriorYears: s.periodUsedPriorYears,
                        periodUsedCurrentYear: s.periodUsedCurrentYear,
                        accumulatedDepreciationBf: String(s.accumulatedDepreciationBf),
                        yearlyDepCharge: String(s.yearlyDepCharge),
                        totalAccumulatedDepreciation: String(s.totalAccumulatedDepreciation),
                        depreciationMethod: s.depreciationMethod,
                        runDate: s.runDate,
                        updatedAt: new Date(),
                    },
                });

            insertedCount++;
        }

        // Insert lifecycle events for all
        await tx.insert(assetLifecycleEvents).values(
            snapshots.map((s) => ({
                organizationId,
                assetId: s.assetId,
                eventType: "depreciation_recorded" as const,
                previousStatus: s.assetStatus,
                newStatus: s.assetStatus,
                description: `Depreciation recorded for fiscal year ${s.fiscalYear} (batch run)`,
                metadata: {
                    fiscalYear: s.fiscalYear,
                    yearlyDepCharge: s.yearlyDepCharge,
                    totalAccumulatedDepreciation: s.totalAccumulatedDepreciation,
                    depreciationMethod: s.depreciationMethod,
                    isBatch: true,
                },
                actorUserId,
                occurredAt: s.runDate,
            }))
        );
    });

    return { inserted: insertedCount, updated: 0 };
}

/**
 * Get depreciation schedule for the organization (all snapshots, paginated).
 */
export async function getDepreciationSchedule(
    organizationId: string,
    fiscalYear: number | undefined,
    page: number,
    limit: number
) {
    const filters = [
        eq(assetDepreciationSnapshots.organizationId, organizationId),
    ];

    if (fiscalYear !== undefined) {
        filters.push(eq(assetDepreciationSnapshots.fiscalYear, fiscalYear));
    }

    const whereClause = and(...filters);
    const offset = (page - 1) * limit;

    const [totalRow] = await db
        .select({ total: sql<number>`count(*)` })
        .from(assetDepreciationSnapshots)
        .where(whereClause);

    const rows = await db
        .select({
            id: assetDepreciationSnapshots.id,
            assetId: assetDepreciationSnapshots.assetId,
            assetName: assets.name,
            assetTag: assets.assetTag,
            fiscalYear: assetDepreciationSnapshots.fiscalYear,
            periodUsedPriorYears: assetDepreciationSnapshots.periodUsedPriorYears,
            periodUsedCurrentYear:
                assetDepreciationSnapshots.periodUsedCurrentYear,
            accumulatedDepreciationBf:
                assetDepreciationSnapshots.accumulatedDepreciationBf,
            yearlyDepCharge: assetDepreciationSnapshots.yearlyDepCharge,
            totalAccumulatedDepreciation:
                assetDepreciationSnapshots.totalAccumulatedDepreciation,
            depreciationMethod: assetDepreciationSnapshots.depreciationMethod,
            runDate: assetDepreciationSnapshots.runDate,
            purchaseCost: assets.purchaseCost,
        })
        .from(assetDepreciationSnapshots)
        .innerJoin(assets, eq(assetDepreciationSnapshots.assetId, assets.id))
        .where(whereClause)
        .orderBy(
            desc(assetDepreciationSnapshots.fiscalYear),
            desc(assetDepreciationSnapshots.runDate)
        )
        .limit(limit)
        .offset(offset);

    const total = Number(totalRow?.total ?? 0);

    return {
        data: rows,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
}