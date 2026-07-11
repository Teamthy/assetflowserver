import {
    bulkUpsertDepreciationSnapshots,
    getDepreciableAssets,
    getDepreciationSchedule,
    getLatestSnapshotBeforeYear,
} from "../repositories/depreciation";
import {
    calculateDepreciation,
    DepreciationCalculationResult,
    DepreciationMethod,
} from "./depreciation.service";
import { notifyDepreciationRunCompleted } from "./notifications";
import { NotFoundError } from "../utils/error";
import { logger } from "../utils/logger";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { assets } from "../model/asset";

// ─── Preview Single Asset Depreciation ────────────────────────────────────────

export async function previewAssetDepreciationService(input: {
    organizationId: string;
    assetId: string;
    fiscalYear: number;
    method: DepreciationMethod;
}): Promise<DepreciationCalculationResult> {
    const { organizationId, assetId, fiscalYear, method } = input;

    // Fetch asset
    const [asset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, assetId))
        .limit(1);

    if (!asset || asset.organizationId !== organizationId) {
        throw new NotFoundError("Asset");
    }

    if (!asset.purchaseDate) {
        throw new NotFoundError("Asset purchase date");
    }

    if (!asset.expectedUsefulLifeMonths) {
        throw new NotFoundError("Asset useful life");
    }

    // Get prior snapshot to determine BF values
    const priorSnapshot = await getLatestSnapshotBeforeYear(
        organizationId,
        assetId,
        fiscalYear
    );

    const accumulatedBf = priorSnapshot
        ? Number(priorSnapshot.totalAccumulatedDepreciation)
        : 0;

    const priorYears = priorSnapshot
        ? priorSnapshot.periodUsedPriorYears +
        priorSnapshot.periodUsedCurrentYear
        : 0;

    const result = calculateDepreciation({
        purchaseCost: Number(asset.purchaseCost),
        residualValue: Number(asset.residualValue ?? 0),
        expectedUsefulLifeMonths: asset.expectedUsefulLifeMonths,
        method,
        fiscalYear,
        purchaseDate: asset.purchaseDate,
        accumulatedDepreciationBf: accumulatedBf,
        periodUsedPriorYears: priorYears,
    });

    return result;
}

// ─── Run Batch Depreciation ───────────────────────────────────────────────────

export async function runDepreciationBatchService(input: {
    organizationId: string;
    actorUserId: string;
    fiscalYear: number;
    method: DepreciationMethod;
    runDate?: Date;
    assetIds?: string[];
    dryRun: boolean;
}) {
    const { organizationId, actorUserId, fiscalYear, method, assetIds, dryRun } =
        input;
    const runDate = input.runDate ?? new Date();

    logger.info("[Depreciation] Batch run started", {
        organizationId,
        fiscalYear,
        method,
        dryRun,
        filteredCount: assetIds?.length ?? "all",
    });

    // 1. Get all eligible assets
    const eligibleAssets = await getDepreciableAssets(organizationId, assetIds);

    if (eligibleAssets.length === 0) {
        logger.warn("[Depreciation] No eligible assets found", {
            organizationId,
            fiscalYear,
        });
        return {
            fiscalYear,
            method,
            eligibleCount: 0,
            processedCount: 0,
            skippedCount: 0,
            failedCount: 0,
            dryRun,
            results: [],
            failures: [],
        };
    }

    // 2. Calculate depreciation for each
    const successfulCalcs: Array<{
        assetId: string;
        assetTag: string;
        assetName: string;
        assetStatus: "active" | "maintenance" | "disposed";
        calculation: DepreciationCalculationResult;
    }> = [];

    const failures: Array<{
        assetId: string;
        assetTag: string;
        reason: string;
    }> = [];

    for (const asset of eligibleAssets) {
        try {
            if (!asset.purchaseDate) {
                failures.push({
                    assetId: asset.id,
                    assetTag: asset.assetTag,
                    reason: "Missing purchase date",
                });
                continue;
            }
            if (!asset.expectedUsefulLifeMonths) {
                failures.push({
                    assetId: asset.id,
                    assetTag: asset.assetTag,
                    reason: "Missing useful life",
                });
                continue;
            }

            const priorSnapshot = await getLatestSnapshotBeforeYear(
                organizationId,
                asset.id,
                fiscalYear
            );

            const accumulatedBf = priorSnapshot
                ? Number(priorSnapshot.totalAccumulatedDepreciation)
                : 0;

            const priorYears = priorSnapshot
                ? priorSnapshot.periodUsedPriorYears +
                priorSnapshot.periodUsedCurrentYear
                : 0;

            const result = calculateDepreciation({
                purchaseCost: Number(asset.purchaseCost),
                residualValue: Number(asset.residualValue ?? 0),
                expectedUsefulLifeMonths: asset.expectedUsefulLifeMonths,
                method,
                fiscalYear,
                purchaseDate: asset.purchaseDate,
                accumulatedDepreciationBf: accumulatedBf,
                periodUsedPriorYears: priorYears,
            });

            successfulCalcs.push({
                assetId: asset.id,
                assetTag: asset.assetTag,
                assetName: asset.name,
                assetStatus: asset.status,
                calculation: result,
            });
        } catch (error) {
            failures.push({
                assetId: asset.id,
                assetTag: asset.assetTag,
                reason:
                    error instanceof Error ? error.message : "Calculation failed",
            });
        }
    }

    // 3. If dry run, return without persisting
    if (dryRun) {
        logger.info("[Depreciation] Dry run complete", {
            organizationId,
            fiscalYear,
            eligibleCount: eligibleAssets.length,
            calculatedCount: successfulCalcs.length,
            failedCount: failures.length,
        });

        return {
            fiscalYear,
            method,
            eligibleCount: eligibleAssets.length,
            processedCount: successfulCalcs.length,
            skippedCount: 0,
            failedCount: failures.length,
            dryRun: true,
            results: successfulCalcs.map((c) => ({
                assetId: c.assetId,
                assetTag: c.assetTag,
                assetName: c.assetName,
                ...c.calculation,
            })),
            failures,
        };
    }

    // 4. Persist all snapshots in one transaction
    const { inserted } = await bulkUpsertDepreciationSnapshots({
        organizationId,
        actorUserId,
        snapshots: successfulCalcs.map((c) => ({
            assetId: c.assetId,
            fiscalYear: c.calculation.fiscalYear,
            periodUsedPriorYears: c.calculation.periodUsedPriorYears,
            periodUsedCurrentYear: c.calculation.periodUsedCurrentYear,
            accumulatedDepreciationBf: c.calculation.accumulatedDepreciationBf,
            yearlyDepCharge: c.calculation.yearlyDepCharge,
            totalAccumulatedDepreciation:
                c.calculation.totalAccumulatedDepreciation,
            depreciationMethod: c.calculation.depreciationMethod,
            runDate,
            assetStatus: c.assetStatus,
        })),
    });

    logger.info("[Depreciation] Batch run persisted", {
        organizationId,
        fiscalYear,
        inserted,
    });

    // 5. Notify admins
    await notifyDepreciationRunCompleted({
        organizationId,
        fiscalYear,
        processedCount: successfulCalcs.length,
        failedCount: failures.length,
    });

    return {
        fiscalYear,
        method,
        eligibleCount: eligibleAssets.length,
        processedCount: successfulCalcs.length,
        skippedCount: 0,
        failedCount: failures.length,
        dryRun: false,
        results: successfulCalcs.map((c) => ({
            assetId: c.assetId,
            assetTag: c.assetTag,
            assetName: c.assetName,
            ...c.calculation,
        })),
        failures,
    };
}

// ─── Get Depreciation Schedule ────────────────────────────────────────────────

export async function getDepreciationScheduleService(input: {
    organizationId: string;
    fiscalYear?: number;
    page: number;
    limit: number;
}) {
    return getDepreciationSchedule(
        input.organizationId,
        input.fiscalYear,
        input.page,
        input.limit
    );
}