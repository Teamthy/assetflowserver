import { logger } from "../utils/logger";
import { NotFoundError, ConflictError } from "../utils/error";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DepreciationMethod = "straight_line" | "reducing_balance";

export interface DepreciationInputs {
    purchaseCost: number;
    residualValue: number;
    expectedUsefulLifeMonths: number;
    method: DepreciationMethod;
    fiscalYear: number;
    purchaseDate: Date;
    accumulatedDepreciationBf: number;
    periodUsedPriorYears: number;
}

export interface DepreciationCalculationResult {
    fiscalYear: number;
    periodUsedPriorYears: number;
    periodUsedCurrentYear: number;
    accumulatedDepreciationBf: number;
    yearlyDepCharge: number;
    totalAccumulatedDepreciation: number;
    depreciationMethod: DepreciationMethod;
    isFullyDepreciated: boolean;
    netBookValue: number;
}

// ─── Straight Line Calculation ────────────────────────────────────────────────

/**
 * Straight-Line Depreciation
 *
 * Formula:
 *   monthly depreciation = (cost - residual) / usefulLifeMonths
 *   yearly charge        = monthly depreciation × months used in fiscal year
 *
 * The yearly charge is capped so accumulated never exceeds (cost - residual).
 */
function calculateStraightLine(
    input: DepreciationInputs
): DepreciationCalculationResult {
    const {
        purchaseCost,
        residualValue,
        expectedUsefulLifeMonths,
        fiscalYear,
        purchaseDate,
        accumulatedDepreciationBf,
        periodUsedPriorYears,
    } = input;

    const depreciableBase = purchaseCost - residualValue;
    const monthlyDepreciation = depreciableBase / expectedUsefulLifeMonths;

    // Calculate months used in the current fiscal year
    const yearStart = new Date(Date.UTC(fiscalYear, 0, 1));
    const yearEnd = new Date(Date.UTC(fiscalYear, 11, 31, 23, 59, 59));

    const periodStart = purchaseDate > yearStart ? purchaseDate : yearStart;
    const periodEnd = yearEnd;

    let monthsUsedCurrentYear = 0;
    if (periodStart <= periodEnd) {
        monthsUsedCurrentYear =
            (periodEnd.getUTCFullYear() - periodStart.getUTCFullYear()) * 12 +
            (periodEnd.getUTCMonth() - periodStart.getUTCMonth()) +
            1;
    }
    monthsUsedCurrentYear = Math.max(0, Math.min(12, monthsUsedCurrentYear));

    // Cap months to remaining useful life
    const remainingMonths =
        expectedUsefulLifeMonths - periodUsedPriorYears;
    const cappedMonths = Math.min(monthsUsedCurrentYear, remainingMonths);

    // Calculate charge
    let yearlyCharge = monthlyDepreciation * cappedMonths;

    // Cap accumulated total to depreciable base
    const potentialAccumulated = accumulatedDepreciationBf + yearlyCharge;
    if (potentialAccumulated > depreciableBase) {
        yearlyCharge = depreciableBase - accumulatedDepreciationBf;
    }
    yearlyCharge = Math.max(0, yearlyCharge);

    const totalAccumulated = accumulatedDepreciationBf + yearlyCharge;
    const isFullyDepreciated = totalAccumulated >= depreciableBase;
    const netBookValue = purchaseCost - totalAccumulated;

    return {
        fiscalYear,
        periodUsedPriorYears,
        periodUsedCurrentYear: cappedMonths,
        accumulatedDepreciationBf: round2(accumulatedDepreciationBf),
        yearlyDepCharge: round2(yearlyCharge),
        totalAccumulatedDepreciation: round2(totalAccumulated),
        depreciationMethod: "straight_line",
        isFullyDepreciated,
        netBookValue: round2(netBookValue),
    };
}

// ─── Reducing Balance Calculation ─────────────────────────────────────────────

/**
 * Reducing Balance (Declining Balance) Depreciation
 *
 * Formula:
 *   annual rate = (1 - (residual / cost)^(1/usefulLifeYears))
 *   yearly charge = (cost - accumulated) × annual rate
 *   pro-rated by months used in fiscal year
 */
function calculateReducingBalance(
    input: DepreciationInputs
): DepreciationCalculationResult {
    const {
        purchaseCost,
        residualValue,
        expectedUsefulLifeMonths,
        fiscalYear,
        purchaseDate,
        accumulatedDepreciationBf,
        periodUsedPriorYears,
    } = input;

    const usefulLifeYears = expectedUsefulLifeMonths / 12;
    const depreciableBase = purchaseCost - residualValue;

    // Calculate annual rate
    let annualRate = 0;
    if (purchaseCost > 0 && residualValue >= 0 && usefulLifeYears > 0) {
        if (residualValue === 0) {
            // Use standard double-declining balance factor
            annualRate = 2 / usefulLifeYears;
        } else {
            annualRate =
                1 - Math.pow(residualValue / purchaseCost, 1 / usefulLifeYears);
        }
    }

    // Calculate months used in the current fiscal year
    const yearStart = new Date(Date.UTC(fiscalYear, 0, 1));
    const yearEnd = new Date(Date.UTC(fiscalYear, 11, 31, 23, 59, 59));

    const periodStart = purchaseDate > yearStart ? purchaseDate : yearStart;
    const periodEnd = yearEnd;

    let monthsUsedCurrentYear = 0;
    if (periodStart <= periodEnd) {
        monthsUsedCurrentYear =
            (periodEnd.getUTCFullYear() - periodStart.getUTCFullYear()) * 12 +
            (periodEnd.getUTCMonth() - periodStart.getUTCMonth()) +
            1;
    }
    monthsUsedCurrentYear = Math.max(0, Math.min(12, monthsUsedCurrentYear));

    // Net book value at start of year
    const nbvAtStart = purchaseCost - accumulatedDepreciationBf;

    // Full year charge
    const fullYearCharge = nbvAtStart * annualRate;

    // Pro-rate by months used
    let yearlyCharge = (fullYearCharge * monthsUsedCurrentYear) / 12;

    // Cap so we never go below residual
    const maxAllowedCharge = nbvAtStart - residualValue;
    if (yearlyCharge > maxAllowedCharge) {
        yearlyCharge = Math.max(0, maxAllowedCharge);
    }

    const totalAccumulated = accumulatedDepreciationBf + yearlyCharge;
    const isFullyDepreciated = totalAccumulated >= depreciableBase;
    const netBookValue = purchaseCost - totalAccumulated;

    return {
        fiscalYear,
        periodUsedPriorYears,
        periodUsedCurrentYear: monthsUsedCurrentYear,
        accumulatedDepreciationBf: round2(accumulatedDepreciationBf),
        yearlyDepCharge: round2(yearlyCharge),
        totalAccumulatedDepreciation: round2(totalAccumulated),
        depreciationMethod: "reducing_balance",
        isFullyDepreciated,
        netBookValue: round2(netBookValue),
    };
}

// ─── Main Calculator ──────────────────────────────────────────────────────────

export function calculateDepreciation(
    input: DepreciationInputs
): DepreciationCalculationResult {
    if (input.method === "reducing_balance") {
        return calculateReducingBalance(input);
    }
    return calculateStraightLine(input);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}