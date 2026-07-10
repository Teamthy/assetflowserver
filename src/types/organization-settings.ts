

export const LOW_VALUE_TREATMENTS = ["track_non_capitalized", "expense"] as const;
export type LowValueTreatment = (typeof LOW_VALUE_TREATMENTS)[number];

export const DEPRECIATION_METHODS = ["straight_line", "reducing_balance"] as const;
export type DepreciationMethod = (typeof DEPRECIATION_METHODS)[number];


export const SUPPORTED_CURRENCIES = ["NGN", "USD", "EUR", "GBP", "KES", "ZAR", "GHS"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];


export interface OrganizationSettingsPublic {
    id: string;
    organizationId: string;
    capitalizationThreshold: string; // e.g., "50000.00"
    capitalizationCurrency: string;  // e.g., "NGN"
    minimumUsefulLifeMonths: number;
    lowValueTreatment: LowValueTreatment;
    defaultDepreciationMethod: DepreciationMethod;
    defaultUsefulLifeYears: number | null;
    createdAt: string;
    updatedAt: string;
}


export const DEFAULT_ORGANIZATION_SETTINGS = {
    capitalizationThreshold: "50000.00",
    capitalizationCurrency: "NGN",
    minimumUsefulLifeMonths: 12,
    lowValueTreatment: "track_non_capitalized" as LowValueTreatment,
    defaultDepreciationMethod: "straight_line" as DepreciationMethod,
    defaultUsefulLifeYears: null,
} as const;