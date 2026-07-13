import {
    getAssetCountByStatus,
    getAssetCountByCondition,
    getAssetCountByCategory,
    getAssetCountByBranch,
    getTotalAssetValue,
    getAssetCountByAccountingTreatment,
    getDepreciationCoverage,
    getDisposalProceedsByMethod,
    getTotalAccumulatedDepreciation,
    getMaintenanceCountByStatus,
    getMaintenanceCountByPriority,
    getOverdueMaintenanceCount,
    getUpcomingMaintenanceCount,
    getAssetFieldCompleteness,
} from "../repositories/reports";
import { logger } from "../utils/logger";

// ─── Asset Dashboard ──────────────────────────────────────────────────────────

export async function getAssetDashboardService(
    organizationId: string,
    branchId?: string  // undefined = org-wide, set = branch-scoped
) {
    logger.info("[Reports] Fetching asset dashboard", { organizationId, branchId });

    const [
        byStatus,
        byCondition,
        byCategory,
        byBranch,
        totalValue,
    ] = await Promise.all([
        getAssetCountByStatus(organizationId, branchId),
        getAssetCountByCondition(organizationId, branchId),
        getAssetCountByCategory(organizationId, branchId),
        getAssetCountByBranch(organizationId, branchId),
        getTotalAssetValue(organizationId, branchId),
    ]);

    const statusMap = Object.fromEntries(
        byStatus.map((r) => [r.status, Number(r.count)])
    );

    return {
        summary: {
            total: byStatus.reduce((acc, r) => acc + Number(r.count), 0),
            active: statusMap["active"] ?? 0,
            maintenance: statusMap["maintenance"] ?? 0,
            disposed: statusMap["disposed"] ?? 0,
            totalActiveValue: totalValue,
        },
        byStatus: byStatus.map((r) => ({
            status: r.status,
            count: Number(r.count),
        })),
        byCondition: byCondition.map((r) => ({
            condition: r.condition,
            count: Number(r.count),
        })),
        byCategory: byCategory.map((r) => ({
            category: r.category ?? "Uncategorized",
            count: Number(r.count),
        })),
        byBranch: byBranch.map((r) => ({
            branchId: r.branchId ?? null,
            branchName: r.branchName ?? "Unassigned",
            count: Number(r.count),
        })),
        scopedToBranch: branchId ?? null,
    };
}

// ─── Finance Dashboard ────────────────────────────────────────────────────────

export async function getFinanceDashboardService(organizationId: string) {
    logger.info("[Reports] Fetching finance dashboard", { organizationId });

    const [
        byTreatment,
        depreciationCoverage,
        disposalProceeds,
        accumulatedDepreciation,
    ] = await Promise.all([
        getAssetCountByAccountingTreatment(organizationId),
        getDepreciationCoverage(organizationId),
        getDisposalProceedsByMethod(organizationId),
        getTotalAccumulatedDepreciation(organizationId),
    ]);

    const treatmentMap = Object.fromEntries(
        byTreatment.map((r) => [
            r.accountingTreatment,
            { count: Number(r.count), totalValue: r.totalValue ?? "0" },
        ])
    );

    return {
        accountingTreatment: {
            capitalized: treatmentMap["capitalized"] ?? { count: 0, totalValue: "0" },
            expensed: treatmentMap["expensed"] ?? { count: 0, totalValue: "0" },
            trackedNonCapitalized: treatmentMap["tracked_non_capitalized"] ?? { count: 0, totalValue: "0" },
            pendingReview: treatmentMap["pending_review"] ?? { count: 0, totalValue: "0" },
        },
        depreciation: {
            ...depreciationCoverage,
            ...accumulatedDepreciation,
        },
        disposals: {
            byMethod: disposalProceeds.map((r) => ({
                method: r.method,
                count: Number(r.count),
                totalProceeds: r.totalProceeds ?? "0",
            })),
            totalProceeds: disposalProceeds
                .reduce((acc, r) => acc + Number(r.totalProceeds ?? 0), 0)
                .toFixed(2),
        },
    };
}

// ─── Maintenance Dashboard ────────────────────────────────────────────────────

export async function getMaintenanceDashboardService(
    organizationId: string,
    branchId?: string
) {
    logger.info("[Reports] Fetching maintenance dashboard", { organizationId, branchId });

    const [
        byStatus,
        byPriority,
        overdueCount,
        upcomingCount,
    ] = await Promise.all([
        getMaintenanceCountByStatus(organizationId, branchId),
        getMaintenanceCountByPriority(organizationId, branchId),
        getOverdueMaintenanceCount(organizationId, branchId),
        getUpcomingMaintenanceCount(organizationId, 7, branchId),
    ]);

    const statusMap = Object.fromEntries(
        byStatus.map((r) => [r.status, Number(r.count)])
    );

    return {
        summary: {
            total: byStatus.reduce((acc, r) => acc + Number(r.count), 0),
            open: statusMap["open"] ?? 0,
            inProgress: statusMap["in_progress"] ?? 0,
            completed: statusMap["completed"] ?? 0,
            cancelled: statusMap["cancelled"] ?? 0,
            overdue: overdueCount,
            dueSoon: upcomingCount,
        },
        byStatus: byStatus.map((r) => ({
            status: r.status,
            count: Number(r.count),
        })),
        byPriority: byPriority.map((r) => ({
            priority: r.priority,
            count: Number(r.count),
        })),
        scopedToBranch: branchId ?? null,
    };
}

// ─── Audit Dashboard ──────────────────────────────────────────────────────────

export async function getAuditDashboardService(
    organizationId: string,
    branchId?: string
) {
    logger.info("[Reports] Fetching audit dashboard", { organizationId, branchId });

    const [fieldCompleteness, byTreatment] = await Promise.all([
        getAssetFieldCompleteness(organizationId, branchId),
        getAssetCountByAccountingTreatment(organizationId),
    ]);

    return {
        fieldCompleteness,
        recognitionSummary: byTreatment.map((r) => ({
            accountingTreatment: r.accountingTreatment,
            count: Number(r.count),
        })),
        riskIndicators: {
            hasUnreviewedAssets: fieldCompleteness.pendingReview > 0,
            hasMissingSerialNumbers: fieldCompleteness.missingSerialNumber > 0,
            hasMissingPurchaseDates: fieldCompleteness.missingPurchaseDate > 0,
            hasMissingCategories: fieldCompleteness.missingCategory > 0,
            hasMissingBranches: fieldCompleteness.missingBranch > 0,
        },
        scopedToBranch: branchId ?? null,
    };
}