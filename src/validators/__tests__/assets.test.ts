import {
  createAssetSchema,
  disposeAssetSchema,
  recordAssetDepreciationSchema,
  transferAssetSchema,
} from "../assets";

describe("asset validators", () => {
  it("rejects residual value above purchase cost", () => {
    const result = createAssetSchema.safeParse({
      name: "Generator",
      assetTag: "GEN-001",
      purchaseCost: 1000,
      residualValue: 1200,
    });

    expect(result.success).toBe(false);
  });

  it("rejects warranty expiry before purchase date", () => {
    const result = createAssetSchema.safeParse({
      name: "Generator",
      assetTag: "GEN-001",
      purchaseCost: 1000,
      purchaseDate: "2026-06-20",
      warrantyExpiryDate: "2025-06-20",
    });

    expect(result.success).toBe(false);
  });

  it("requires a branch or user for transfer", () => {
    const result = transferAssetSchema.safeParse({
      reason: "Moving asset",
    });

    expect(result.success).toBe(false);
  });

  it("validates accumulated depreciation arithmetic", () => {
    const result = recordAssetDepreciationSchema.safeParse({
      fiscalYear: 2026,
      periodUsedCurrentYear: 12,
      accumulatedDepreciationBf: 100,
      yearlyDepCharge: 50,
      totalAccumulatedDepreciation: 140,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid disposal payload", () => {
    const result = disposeAssetSchema.safeParse({
      method: "sold",
      reason: "Asset replaced",
      proceeds: 500,
    });

    expect(result.success).toBe(true);
  });
});
