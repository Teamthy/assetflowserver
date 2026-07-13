import { and, count, eq, gt, isNull, lt, lte, sum, isNotNull } from "drizzle-orm";
import { db } from "../db";
import {
    assets,
    assetDepreciationSnapshots,
    assetDisposals,
} from "../model/asset";
import { maintenanceTasks } from "../model/maintenance";
import { branches } from "../model/branch";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Build branch filter condition
// When branchId is provided, scope the query to that branch only
// ─────────────────────────────────────────────────────────────────────────────

function withBranchFilter(organizationId: string, branchId?: string) {
    return branchId
        ? and(eq(assets.organizationId, organizationId), eq(assets.branchId, branchId), isNull(assets.deletedAt))
        : and(eq(assets.organizationId, organizationId), isNull(assets.deletedAt));
}

function withMaintenanceBranchFilter(organizationId: string, branchId?: string) {
    if (!branchId) {
        return and(
            eq(maintenanceTasks.organizationId, organizationId),
            isNull(maintenanceTasks.deletedAt)
        );
    }
    // Filter maintenance tasks via their asset's branch
    return and(
        eq(maintenanceTasks.organizationId, organizationId),
        isNull(maintenanceTasks.deletedAt),
        eq(assets.branchId, branchId)
    );
}

// ─── Asset Dashboard ──────────────────────────────────────────────────────────

export async function getAssetCountByStatus(
    organizationId: string,
    branchId?: string
) {
    return db
        .select({ status: assets.status, count: count() })
        .from(assets)
        .where(withBranchFilter(organizationId, branchId))
        .groupBy(assets.status);
}

export async function getAssetCountByCondition(
    organizationId: string,
    branchId?: string
) {
    return db
        .select({ condition: assets.condition, count: count() })
        .from(assets)
        .where(withBranchFilter(organizationId, branchId))
        .groupBy(assets.condition);
}

export async function getAssetCountByCategory(
    organizationId: string,
    branchId?: string
) {
    return db
        .select({ category: assets.category, count: count() })
        .from(assets)
        .where(withBranchFilter(organizationId, branchId))
        .groupBy(assets.category);
}

export async function getAssetCountByBranch(
    organizationId: string,
    branchId?: string
) {
    return db
        .select({
            branchId: assets.branchId,
            branchName: branches.name,
            count: count(),
        })
        .from(assets)
        .leftJoin(branches, eq(assets.branchId, branches.id))
        .where(withBranchFilter(organizationId, branchId))
        .groupBy(assets.branchId, branches.name);
}

export async function getTotalAssetValue(
    organizationId: string,
    branchId?: string
) {
    const filter = branchId
        ? and(
            eq(assets.organizationId, organizationId),
            eq(assets.branchId, branchId),
            isNull(assets.deletedAt),
            eq(assets.status, "active")
        )
        : and(
            eq(assets.organizationId, organizationId),
            isNull(assets.deletedAt),
            eq(assets.status, "active")
        );

    const rows = await db
        .select({ total: sum(assets.purchaseCost) })
        .from(assets)
        .where(filter);

    return rows[0]?.total ?? "0";
}

// ─── Finance Dashboard ────────────────────────────────────────────────────────

export async function getAssetCountByAccountingTreatment(
    organizationId: string
) {
    return db
        .select({
            accountingTreatment: assets.accountingTreatment,
            count: count(),
            totalValue: sum(assets.purchaseCost),
        })
        .from(assets)
        .where(and(eq(assets.organizationId, organizationId), isNull(assets.deletedAt)))
        .groupBy(assets.accountingTreatment);
}

export async function getDepreciationCoverage(organizationId: string) {
    const currentYear = new Date().getFullYear();

    const [totalRow] = await db
        .select({ count: count() })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt),
                eq(assets.isDepreciable, true),
                eq(assets.accountingTreatment, "capitalized")
            )
        );

    const [coveredRow] = await db
        .select({ count: count() })
        .from(assetDepreciationSnapshots)
        .where(
            and(
                eq(assetDepreciationSnapshots.organizationId, organizationId),
                eq(assetDepreciationSnapshots.fiscalYear, currentYear)
            )
        );

    const total = Number(totalRow?.count ?? 0);
    const covered = Number(coveredRow?.count ?? 0);

    return {
        currentFiscalYear: currentYear,
        totalDepreciableAssets: total,
        assetsWithCurrentYearDepreciation: covered,
        assetsWithoutDepreciation: total - covered,
        coveragePercent: total > 0 ? Math.round((covered / total) * 100) : 0,
    };
}

export async function getDisposalProceedsByMethod(organizationId: string) {
    return db
        .select({
            method: assetDisposals.method,
            count: count(),
            totalProceeds: sum(assetDisposals.proceeds),
        })
        .from(assetDisposals)
        .where(eq(assetDisposals.organizationId, organizationId))
        .groupBy(assetDisposals.method);
}

export async function getTotalAccumulatedDepreciation(organizationId: string) {
    const currentYear = new Date().getFullYear();

    const rows = await db
        .select({
            total: sum(assetDepreciationSnapshots.totalAccumulatedDepreciation),
            totalCurrentYear: sum(assetDepreciationSnapshots.yearlyDepCharge),
        })
        .from(assetDepreciationSnapshots)
        .where(
            and(
                eq(assetDepreciationSnapshots.organizationId, organizationId),
                eq(assetDepreciationSnapshots.fiscalYear, currentYear)
            )
        );

    return {
        totalAccumulated: rows[0]?.total ?? "0",
        currentYearCharge: rows[0]?.totalCurrentYear ?? "0",
    };
}

// ─── Maintenance Dashboard ────────────────────────────────────────────────────

export async function getMaintenanceCountByStatus(
    organizationId: string,
    branchId?: string
) {
    if (branchId) {
        return db
            .select({ status: maintenanceTasks.status, count: count() })
            .from(maintenanceTasks)
            .innerJoin(assets, eq(maintenanceTasks.assetId, assets.id))
            .where(withMaintenanceBranchFilter(organizationId, branchId))
            .groupBy(maintenanceTasks.status);
    }

    return db
        .select({ status: maintenanceTasks.status, count: count() })
        .from(maintenanceTasks)
        .where(
            and(
                eq(maintenanceTasks.organizationId, organizationId),
                isNull(maintenanceTasks.deletedAt)
            )
        )
        .groupBy(maintenanceTasks.status);
}

export async function getMaintenanceCountByPriority(
    organizationId: string,
    branchId?: string
) {
    if (branchId) {
        return db
            .select({ priority: maintenanceTasks.priority, count: count() })
            .from(maintenanceTasks)
            .innerJoin(assets, eq(maintenanceTasks.assetId, assets.id))
            .where(
                and(
                    withMaintenanceBranchFilter(organizationId, branchId),
                    eq(maintenanceTasks.status, "open")
                )
            )
            .groupBy(maintenanceTasks.priority);
    }

    return db
        .select({ priority: maintenanceTasks.priority, count: count() })
        .from(maintenanceTasks)
        .where(
            and(
                eq(maintenanceTasks.organizationId, organizationId),
                isNull(maintenanceTasks.deletedAt),
                eq(maintenanceTasks.status, "open")
            )
        )
        .groupBy(maintenanceTasks.priority);
}

export async function getOverdueMaintenanceCount(
    organizationId: string,
    branchId?: string
) {
    const now = new Date();

    if (branchId) {
        const [row] = await db
            .select({ count: count() })
            .from(maintenanceTasks)
            .innerJoin(assets, eq(maintenanceTasks.assetId, assets.id))
            .where(
                and(
                    withMaintenanceBranchFilter(organizationId, branchId),
                    isNotNull(maintenanceTasks.dueAt),
                    lt(maintenanceTasks.dueAt, now),
                    eq(maintenanceTasks.status, "open")
                )
            );
        return Number(row?.count ?? 0);
    }

    const [row] = await db
        .select({ count: count() })
        .from(maintenanceTasks)
        .where(
            and(
                eq(maintenanceTasks.organizationId, organizationId),
                isNull(maintenanceTasks.deletedAt),
                isNotNull(maintenanceTasks.dueAt),
                lt(maintenanceTasks.dueAt, now),
                eq(maintenanceTasks.status, "open")
            )
        );

    return Number(row?.count ?? 0);
}

export async function getUpcomingMaintenanceCount(
    organizationId: string,
    daysAhead = 7,
    branchId?: string
) {
    const now = new Date();
    const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    if (branchId) {
        const [row] = await db
            .select({ count: count() })
            .from(maintenanceTasks)
            .innerJoin(assets, eq(maintenanceTasks.assetId, assets.id))
            .where(
                and(
                    withMaintenanceBranchFilter(organizationId, branchId),
                    isNotNull(maintenanceTasks.dueAt),
                    gt(maintenanceTasks.dueAt, now),
                    lte(maintenanceTasks.dueAt, until),
                    eq(maintenanceTasks.status, "open")
                )
            );
        return Number(row?.count ?? 0);
    }

    const [row] = await db
        .select({ count: count() })
        .from(maintenanceTasks)
        .where(
            and(
                eq(maintenanceTasks.organizationId, organizationId),
                isNull(maintenanceTasks.deletedAt),
                isNotNull(maintenanceTasks.dueAt),
                gt(maintenanceTasks.dueAt, now),
                lte(maintenanceTasks.dueAt, until),
                eq(maintenanceTasks.status, "open")
            )
        );

    return Number(row?.count ?? 0);
}

// ─── Audit Dashboard ──────────────────────────────────────────────────────────

export async function getAssetFieldCompleteness(
    organizationId: string,
    branchId?: string
) {
    const base = withBranchFilter(organizationId, branchId);

    const [total] = await db
        .select({ count: count() })
        .from(assets)
        .where(base);

    const [missingSerial] = await db
        .select({ count: count() })
        .from(assets)
        .where(and(base, isNull(assets.serialNumber)));

    const [missingPurchaseDate] = await db
        .select({ count: count() })
        .from(assets)
        .where(and(base, isNull(assets.purchaseDate)));

    const [missingCategory] = await db
        .select({ count: count() })
        .from(assets)
        .where(and(base, isNull(assets.category)));

    const [missingBranch] = await db
        .select({ count: count() })
        .from(assets)
        .where(and(base, isNull(assets.branchId)));

    const [pendingReview] = await db
        .select({ count: count() })
        .from(assets)
        .where(and(base, eq(assets.accountingTreatment, "pending_review")));

    const totalCount = Number(total?.count ?? 0);
    const missingSerialCount = Number(missingSerial?.count ?? 0);

    return {
        totalAssets: totalCount,
        missingSerialNumber: missingSerialCount,
        missingPurchaseDate: Number(missingPurchaseDate?.count ?? 0),
        missingCategory: Number(missingCategory?.count ?? 0),
        missingBranch: Number(missingBranch?.count ?? 0),
        pendingReview: Number(pendingReview?.count ?? 0),
        completenessPercent: totalCount > 0
            ? Math.round(((totalCount - missingSerialCount) / totalCount) * 100)
            : 100,
    };
}