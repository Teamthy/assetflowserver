import { and, count, eq, gt, isNull, lt, lte, sum, isNotNull } from "drizzle-orm";
import { db } from "../db";
import {
    assets,
    assetDepreciationSnapshots,
    assetDisposals,
} from "../model/asset";
import { maintenanceTasks } from "../model/maintenance";
import { branches } from "../model/branch";

// ─── Asset Dashboard ──────────────────────────────────────────────────────────

/**
 * Count assets grouped by status
 */
export async function getAssetCountByStatus(organizationId: string) {
    const rows = await db
        .select({
            status: assets.status,
            count: count(),
        })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt)
            )
        )
        .groupBy(assets.status);

    return rows;
}

/**
 * Count assets grouped by condition
 */
export async function getAssetCountByCondition(organizationId: string) {
    const rows = await db
        .select({
            condition: assets.condition,
            count: count(),
        })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt)
            )
        )
        .groupBy(assets.condition);

    return rows;
}

/**
 * Count assets grouped by category
 */
export async function getAssetCountByCategory(organizationId: string) {
    const rows = await db
        .select({
            category: assets.category,
            count: count(),
        })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt)
            )
        )
        .groupBy(assets.category);

    return rows;
}

/**
 * Count assets grouped by branch
 */
export async function getAssetCountByBranch(organizationId: string) {
    const rows = await db
        .select({
            branchId: assets.branchId,
            branchName: branches.name,
            count: count(),
        })
        .from(assets)
        .leftJoin(branches, eq(assets.branchId, branches.id))
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt)
            )
        )
        .groupBy(assets.branchId, branches.name);

    return rows;
}

/**
 * Total purchase cost of all active assets
 */
export async function getTotalAssetValue(organizationId: string) {
    const rows = await db
        .select({
            total: sum(assets.purchaseCost),
        })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt),
                eq(assets.status, "active")
            )
        );

    return rows[0]?.total ?? "0";
}

// ─── Finance Dashboard ────────────────────────────────────────────────────────

/**
 * Count assets grouped by accounting treatment
 */
export async function getAssetCountByAccountingTreatment(
    organizationId: string
) {
    const rows = await db
        .select({
            accountingTreatment: assets.accountingTreatment,
            count: count(),
            totalValue: sum(assets.purchaseCost),
        })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt)
            )
        )
        .groupBy(assets.accountingTreatment);

    return rows;
}

/**
 * Count depreciable assets with/without current year depreciation
 */
export async function getDepreciationCoverage(organizationId: string) {
    const currentYear = new Date().getFullYear();

    // Total depreciable capitalized assets
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

    // Assets with current year depreciation snapshot
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

/**
 * Total disposal proceeds grouped by method
 */
export async function getDisposalProceedsByMethod(organizationId: string) {
    const rows = await db
        .select({
            method: assetDisposals.method,
            count: count(),
            totalProceeds: sum(assetDisposals.proceeds),
        })
        .from(assetDisposals)
        .where(eq(assetDisposals.organizationId, organizationId))
        .groupBy(assetDisposals.method);

    return rows;
}

/**
 * Total accumulated depreciation across all assets
 */
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

/**
 * Count maintenance tasks grouped by status
 */
export async function getMaintenanceCountByStatus(organizationId: string) {
    const rows = await db
        .select({
            status: maintenanceTasks.status,
            count: count(),
        })
        .from(maintenanceTasks)
        .where(
            and(
                eq(maintenanceTasks.organizationId, organizationId),
                isNull(maintenanceTasks.deletedAt)
            )
        )
        .groupBy(maintenanceTasks.status);

    return rows;
}

/**
 * Count maintenance tasks grouped by priority
 */
export async function getMaintenanceCountByPriority(organizationId: string) {
    const rows = await db
        .select({
            priority: maintenanceTasks.priority,
            count: count(),
        })
        .from(maintenanceTasks)
        .where(
            and(
                eq(maintenanceTasks.organizationId, organizationId),
                isNull(maintenanceTasks.deletedAt),
                eq(maintenanceTasks.status, "open")
            )
        )
        .groupBy(maintenanceTasks.priority);

    return rows;
}

/**
 * Count overdue maintenance tasks
 * Tasks that are open/in_progress and past their due date
 */
export async function getOverdueMaintenanceCount(organizationId: string) {
    const now = new Date();

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

/**
 * Count maintenance tasks due within the next N days
 */
export async function getUpcomingMaintenanceCount(
    organizationId: string,
    daysAhead = 7
) {
    const now = new Date();
    const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

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

/**
 * Count assets with missing critical fields
 */
export async function getAssetFieldCompleteness(organizationId: string) {
    const [total] = await db
        .select({ count: count() })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt)
            )
        );

    const [missingSerial] = await db
        .select({ count: count() })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt),
                isNull(assets.serialNumber)
            )
        );

    const [missingPurchaseDate] = await db
        .select({ count: count() })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt),
                isNull(assets.purchaseDate)
            )
        );

    const [missingCategory] = await db
        .select({ count: count() })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt),
                isNull(assets.category)
            )
        );

    const [missingBranch] = await db
        .select({ count: count() })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt),
                isNull(assets.branchId)
            )
        );

    const [pendingReview] = await db
        .select({ count: count() })
        .from(assets)
        .where(
            and(
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt),
                eq(assets.accountingTreatment, "pending_review")
            )
        );

    const totalCount = Number(total?.count ?? 0);

    return {
        totalAssets: totalCount,
        missingSerialNumber: Number(missingSerial?.count ?? 0),
        missingPurchaseDate: Number(missingPurchaseDate?.count ?? 0),
        missingCategory: Number(missingCategory?.count ?? 0),
        missingBranch: Number(missingBranch?.count ?? 0),
        pendingReview: Number(pendingReview?.count ?? 0),
        completenessPercent:
            totalCount > 0
                ? Math.round(
                    ((totalCount - Number(missingSerial?.count ?? 0)) /
                        totalCount) *
                    100
                )
                : 100,
    };
}