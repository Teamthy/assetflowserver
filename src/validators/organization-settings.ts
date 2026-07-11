import { z } from "zod";
import {
    DEPRECIATION_METHODS,
    LOW_VALUE_TREATMENTS,
    SUPPORTED_CURRENCIES,
} from "../types/organization-settings";


export const updateOrganizationSettingsSchema = z
    .object({
        capitalizationThreshold: z
            .string()
            .regex(
                /^\d+(\.\d{1,2})?$/,
                "Must be a positive number with up to 2 decimal places (e.g., '50000.00')",
            )
            .refine(
                (val) => parseFloat(val) >= 0,
                "Capitalization threshold cannot be negative",
            )
            .refine(
                (val) => parseFloat(val) <= 999_999_999_999.99,
                "Capitalization threshold exceeds maximum supported value",
            ),

        capitalizationCurrency: z.enum(SUPPORTED_CURRENCIES, {
            error: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}`,
        }),
        minimumUsefulLifeMonths: z
            .number()
            .int("Must be a whole number of months")
            .min(1, "Must be at least 1 month")
            .max(600, "Cannot exceed 600 months (50 years)"),

        lowValueTreatment: z.enum(LOW_VALUE_TREATMENTS),

        defaultDepreciationMethod: z.enum(DEPRECIATION_METHODS),

        defaultUsefulLifeYears: z
            .number()
            .int("Must be a whole number of years")
            .min(1, "Must be at least 1 year")
            .max(100, "Cannot exceed 100 years")
            .nullable(),
    })
    .partial()
    .refine(
        (data) => Object.keys(data).length > 0,
        { message: "At least one field must be provided for update" },
    );

export type UpdateOrganizationSettingsInput = z.infer<
    typeof updateOrganizationSettingsSchema
>;