import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === null) return undefined;
  return value;
};

const uuidSchema = z.preprocess(emptyToUndefined, z.uuid());
const optionalUuid = z.preprocess(emptyToUndefined, z.uuid().optional());
const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());

const requiredMoney = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}, z.number({ error: "Purchase cost is required" }).nonnegative());

const optionalMoney = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}, z.number().nonnegative().optional());

export const assetStatusSchema = z.enum(["active", "maintenance", "disposed"]);
export const assetConditionSchema = z.enum(["excellent", "good", "fair", "poor"]);

export const assetListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  search: z.string().trim().min(1).optional(),
  status: assetStatusSchema.optional(),
  condition: assetConditionSchema.optional(),
  category: z.string().trim().min(1).max(120).optional(),
  accountingTreatment: z
    .enum(["capitalized", "expensed", "tracked_non_capitalized", "pending_review"])
    .optional(),
  branchId: optionalUuid,
  assignedTo: optionalUuid,
  purchasedFrom: optionalDate,
  purchasedTo: optionalDate,
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
  serialNumber: z.preprocess((value) => {
    if (value === "" || value === null) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  }, z.string().trim().max(160).optional()),
  category: z.string().trim().max(120).optional(),
  manufacturer: z.string().trim().max(120).optional(),
  model: z.string().trim().max(120).optional(),
  branchId: optionalUuid,
  assignedTo: optionalUuid,
  status: assetStatusSchema.default("active"),
  condition: assetConditionSchema.default("good"),
  purchaseCost: requiredMoney,
  purchaseDate: optionalDate,
  warrantyExpiryDate: optionalDate,
  expectedUsefulLifeMonths: z.coerce.number().int().nonnegative().optional(),
  residualValue: optionalMoney,
  hasFutureEconomicBenefit: z.boolean().default(true),
  costCanBeReliablyMeasured: z.boolean().default(true),
  qrCodeUrl: optionalUrl,
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
    toBranchId: optionalUuid,
    branchId: optionalUuid,
    toUserId: optionalUuid,
    reason: z.string().trim().max(2000).optional(),
  })
  .transform((value) => ({
    toBranchId: value.toBranchId ?? value.branchId,
    toUserId: value.toUserId,
    reason: value.reason,
  }))
  .refine((value) => Boolean(value.toBranchId || value.toUserId), {
    message: "At least one of toBranchId or toUserId is required",
  });

export const disposeAssetSchema = z.object({
  method: z.enum(["sold", "donated", "scrapped", "lost", "written_off", "other"]),
  reason: z.string().trim().min(2).max(2000),
  proceeds: z.coerce.number().nonnegative().default(0),
  disposedAt: optionalDate,
  approvedByUserId: optionalUuid,
  notes: z.string().trim().max(5000).optional(),
});

export const restoreAssetSchema = z
  .object({
    reason: z.string().trim().min(2).max(2000),
    status: z.enum(["active", "maintenance"]).optional(),
    targetStatus: z.enum(["active", "maintenance"]).optional(),
  })
  .transform((value) => ({
    reason: value.reason,
    status: value.status ?? value.targetStatus ?? "active",
  }));

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
  serialNumber: z.preprocess((value) => {
    if (value === "" || value === null) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  }, z.string().trim().optional()),
  purchaseCost: requiredMoney,
  purchaseDate: optionalDate,
  branchId: z.preprocess(emptyToUndefined, z.string().trim().max(180).optional()),
  assignedTo: optionalUuid,
  status: assetStatusSchema.optional(),
  expectedUsefulLifeMonths: z.coerce.number().int().nonnegative().optional(),
  hasFutureEconomicBenefit: z.boolean().default(true),
  costCanBeReliablyMeasured: z.boolean().default(true),
});

export const assetAuditQuerySchema = z.object({
  includeDeleted: z.coerce.boolean().default(false),
});

export const exportAssetsQuerySchema = assetListQuerySchema;

// ─── Bulk Operations ──────────────────────────────────────────────────────────

export const bulkDeleteAssetsSchema = z.object({
  assetIds: z
    .array(z.uuid("Each asset ID must be a valid UUID"))
    .min(1, "At least one asset ID is required")
    .max(100, "Maximum 100 assets per bulk operation"),
  reason: z.string().trim().max(2000).optional(),
});

export const bulkTransferAssetsSchema = z
  .object({
    assetIds: z
      .array(z.uuid("Each asset ID must be a valid UUID"))
      .min(1, "At least one asset ID is required")
      .max(100, "Maximum 100 assets per bulk operation"),
    toBranchId: z.uuid("Invalid branch ID").optional(),
    toUserId: z.uuid("Invalid user ID").optional(),
    reason: z.string().trim().max(2000).optional(),
  })
  .refine((value) => Boolean(value.toBranchId || value.toUserId), {
    message: "At least one of toBranchId or toUserId is required",
  });

export const bulkUpdateStatusSchema = z.object({
  assetIds: z
    .array(z.uuid("Each asset ID must be a valid UUID"))
    .min(1, "At least one asset ID is required")
    .max(100, "Maximum 100 assets per bulk operation"),
  status: z.enum(["active", "maintenance"]),
  reason: z.string().trim().max(2000).optional(),
});

export const bulkDisposeAssetsSchema = z.object({
  assetIds: z
    .array(z.uuid("Each asset ID must be a valid UUID"))
    .min(1, "At least one asset ID is required")
    .max(100, "Maximum 100 assets per bulk operation"),
  method: z.enum(["sold", "donated", "scrapped", "lost", "written_off", "other"]),
  reason: z.string().trim().min(2).max(2000),
  proceeds: z.coerce.number().nonnegative().default(0),
  disposedAt: optionalDate,
  notes: z.string().trim().max(5000).optional(),
});

// ─── Approval Workflows ───────────────────────────────────────────────────────

export const requestDisposalApprovalSchema = z.object({
  method: z.enum(["sold", "donated", "scrapped", "lost", "written_off", "other"]),
  reason: z.string().trim().min(2).max(2000),
  proceeds: z.coerce.number().nonnegative().default(0),
  disposedAt: optionalDate,
  notes: z.string().trim().max(5000).optional(),
});

const approvalDecisionSchema = z
  .object({
    approved: z.boolean().optional(),
    decision: z.enum(["approved", "rejected"]).optional(),
    notes: z.string().trim().max(2000).optional(),
    decisionReason: z.string().trim().max(2000).optional(),
  })
  .refine(
    (value) => value.approved !== undefined || value.decision !== undefined,
    { message: "approved or decision is required" },
  )
  .transform((value) => ({
    approved: value.approved ?? value.decision === "approved",
    notes: value.notes ?? value.decisionReason,
  }));

export const approveDisposalSchema = approvalDecisionSchema;

export const requestTransferApprovalSchema = z
  .object({
    toBranchId: optionalUuid,
    branchId: optionalUuid,
    toUserId: optionalUuid,
    reason: z.string().trim().max(2000).optional(),
  })
  .transform((value) => ({
    toBranchId: value.toBranchId ?? value.branchId,
    toUserId: value.toUserId,
    reason: value.reason,
  }))
  .refine((value) => Boolean(value.toBranchId || value.toUserId), {
    message: "At least one of toBranchId or toUserId is required",
  });

export const approveTransferSchema = approvalDecisionSchema;