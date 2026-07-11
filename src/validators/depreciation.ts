import { z } from "zod";

export const runDepreciationBatchSchema = z.object({
    fiscalYear: z.coerce
        .number()
        .int()
        .min(1900)
        .max(2200),
    method: z
        .enum(["straight_line", "reducing_balance"])
        .default("straight_line"),
    runDate: z.coerce.date().optional(),
    assetIds: z
        .array(z.uuid())
        .max(1000, "Maximum 1000 assets per batch run")
        .optional(),
    dryRun: z.boolean().default(false),
});

export const previewAssetDepreciationSchema = z.object({
    fiscalYear: z.coerce.number().int().min(1900).max(2200),
    method: z
        .enum(["straight_line", "reducing_balance"])
        .default("straight_line"),
});

export const depreciationScheduleQuerySchema = z.object({
    fiscalYear: z.coerce.number().int().min(1900).max(2200).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type RunDepreciationBatchInput = z.infer<
    typeof runDepreciationBatchSchema
>;
export type PreviewAssetDepreciationInput = z.infer<
    typeof previewAssetDepreciationSchema
>;
export type DepreciationScheduleQuery = z.infer<
    typeof depreciationScheduleQuerySchema
>;