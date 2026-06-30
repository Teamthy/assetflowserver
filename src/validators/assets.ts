import { z } from "zod";

const uuidSchema = z.uuid();
const isoDateInput = z.coerce.date();

export const assetStatusSchema = z.enum(["active", "maintenance", "disposed"]);
export const assetConditionSchema = z.enum(["excellent", "good", "fair", "poor"]);

export const assetListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().trim().min(1).optional(),
  status: assetStatusSchema.optional(),
  branchId: uuidSchema.optional(),
  assignedTo: uuidSchema.optional(),
  purchasedFrom: isoDateInput.optional(),
  purchasedTo: isoDateInput.optional(),
  sortBy: z
    .enum(["name", "purchaseDate", "createdAt", "status", "assetTag"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  includeDeleted: z.coerce.boolean().default(false),
}).refine(
  (value) =>
    !(value.purchasedFrom && value.purchasedTo) ||
    value.purchasedFrom <= value.purchasedTo,
  {
    message: "purchasedFrom must be before or equal to purchasedTo",
    path: ["purchasedTo"],
  },
);

const assetFieldsSchema = z.object({
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(5000).optional(),
  assetTag: z.string().trim().min(1).max(120),
  serialNumber: z.string().trim().max(160).optional(),
  category: z.string().trim().max(120).optional(),
  manufacturer: z.string().trim().max(120).optional(),
  model: z.string().trim().max(120).optional(),
  branchId: uuidSchema.optional(),
  assignedTo: uuidSchema.optional(),
  status: assetStatusSchema.default("active"),
  condition: assetConditionSchema.default("good"),
  purchaseCost: z.coerce.number().nonnegative(),
  purchaseDate: isoDateInput.optional(),
  warrantyExpiryDate: isoDateInput.optional(),
  expectedUsefulLifeMonths: z.coerce.number().int().nonnegative().optional(),
  residualValue: z.coerce.number().nonnegative().optional(),
  hasFutureEconomicBenefit: z.boolean().default(true),
  costCanBeReliablyMeasured: z.boolean().default(true),
  qrCodeUrl: z.url().optional(),
  isDepreciable: z.boolean().default(true),
});

export const createAssetSchema = assetFieldsSchema
  .refine(
    (value) =>
      !(value.purchaseDate && value.warrantyExpiryDate) ||
      value.warrantyExpiryDate >= value.purchaseDate,
    {
      message: "warrantyExpiryDate must be after purchaseDate",
      path: ["warrantyExpiryDate"],
    },
  )
  .refine(
    (value) =>
      value.residualValue === undefined ||
      value.residualValue <= value.purchaseCost,
    {
      message: "residualValue cannot exceed purchaseCost",
      path: ["residualValue"],
    },
  );

export const updateAssetSchema = assetFieldsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required for update" },
);

export const assetParamsSchema = z.object({
  id: uuidSchema,
});

export const transferAssetSchema = z
  .object({
    toBranchId: uuidSchema.optional(),
    toUserId: uuidSchema.optional(),
    reason: z.string().trim().max(2000).optional(),
  })
  .refine((value) => Boolean(value.toBranchId || value.toUserId), {
    message: "At least one of toBranchId or toUserId is required",
  });

export const disposeAssetSchema = z.object({
  method: z.enum(["sold", "donated", "scrapped", "lost", "written_off", "other"]),
  reason: z.string().trim().min(2).max(2000),
  proceeds: z.coerce.number().nonnegative().default(0),
  disposedAt: z.coerce.date().optional(),
  approvedByUserId: uuidSchema.optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const restoreAssetSchema = z.object({
  reason: z.string().trim().min(2).max(2000),
  status: z.enum(["active", "maintenance"]).default("active"),
});

export const recordAssetDepreciationSchema = z
  .object({
    fiscalYear: z.coerce.number().int().min(1900).max(2200),
    periodUsedPriorYears: z.coerce.number().int().nonnegative().default(0),
    periodUsedCurrentYear: z.coerce.number().int().min(0).max(12),
    accumulatedDepreciationBf: z.coerce.number().nonnegative().default(0),
    yearlyDepCharge: z.coerce.number().nonnegative(),
    totalAccumulatedDepreciation: z.coerce.number().nonnegative(),
    depreciationMethod: z
      .enum(["straight_line", "reducing_balance"])
      .default("straight_line"),
    runDate: z.coerce.date().optional(),
  })
  .refine(
    (value) =>
      Math.abs(
        value.accumulatedDepreciationBf +
          value.yearlyDepCharge -
          value.totalAccumulatedDepreciation,
      ) < 0.01,
    {
      message:
        "totalAccumulatedDepreciation must equal accumulatedDepreciationBf plus yearlyDepCharge",
      path: ["totalAccumulatedDepreciation"],
    },
  );

export const assetLifecycleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  eventType: z
    .enum([
      "registered",
      "updated",
      "assigned",
      "transferred",
      "status_changed",
      "maintenance_scheduled",
      "maintenance_started",
      "maintenance_completed",
      "disposed",
      "deleted",
      "restored",
      "depreciation_recorded",
    ])
    .optional(),
});

export const importAssetRowSchema = z.object({
  name: z.string().trim().min(2),
  assetTag: z.string().trim().min(1),
  serialNumber: z.string().trim().optional(),
  purchaseCost: z.coerce.number().nonnegative(),
  purchaseDate: isoDateInput.optional(),
  branchId: uuidSchema.optional(),
  assignedTo: uuidSchema.optional(),
  status: assetStatusSchema.optional(),
  expectedUsefulLifeMonths: z.coerce.number().int().nonnegative().optional(),
  hasFutureEconomicBenefit: z.boolean().default(true),
  costCanBeReliablyMeasured: z.boolean().default(true),
});

export const assetAuditQuerySchema = z.object({
  includeDeleted: z.coerce.boolean().default(false),
});

export const exportAssetsQuerySchema = assetListQuerySchema;
