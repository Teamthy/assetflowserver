export type LowValueAssetTreatment = "EXPENSE" | "TRACK_NON_CAPITALIZED";

export type AssetRecognitionInput = {
  cost: number;
  usefulLifeMonths?: number | null;
  hasFutureEconomicBenefit?: boolean | null;
  costCanBeReliablyMeasured?: boolean | null;
  capitalizationThreshold: number;
  minimumUsefulLifeMonths?: number;
  lowValueAssetTreatment?: LowValueAssetTreatment;
};

export type AssetRecognitionDecision =
  | "CAPITALIZE"
  | "EXPENSE"
  | "TRACK_NON_CAPITALIZED"
  | "PENDING_REVIEW";

export type AssetRecognitionResult = {
  isRecognizedAsset: boolean;
  decision: AssetRecognitionDecision;
  recognitionStatus: "recognized" | "not_recognized" | "pending_review";
  accountingTreatment:
    | "capitalized"
    | "expensed"
    | "tracked_non_capitalized"
    | "pending_review";
  reasons: string[];
};

export const getDefaultCapitalizationPolicy = () => ({
  capitalizationThreshold: 50000,
  currency: "NGN",
  minimumUsefulLifeMonths: 12,
  lowValueAssetTreatment: "TRACK_NON_CAPITALIZED" as const,
});

export const evaluateAssetRecognition = (
  input: AssetRecognitionInput,
): AssetRecognitionResult => {
  const reasons: string[] = [];
  const minimumUsefulLifeMonths = input.minimumUsefulLifeMonths ?? 12;
  const lowValueAssetTreatment =
    input.lowValueAssetTreatment ?? "TRACK_NON_CAPITALIZED";

  if (input.cost == null || Number.isNaN(input.cost)) {
    reasons.push("Asset cost is required.");
  }

  if (input.usefulLifeMonths == null) {
    reasons.push("Useful life is required.");
  }

  if (input.hasFutureEconomicBenefit == null) {
    reasons.push("Future economic benefit must be confirmed.");
  }

  if (input.costCanBeReliablyMeasured == null) {
    reasons.push("Reliable cost measurement must be confirmed.");
  }

  if (reasons.length > 0) {
    return {
      isRecognizedAsset: false,
      decision: "PENDING_REVIEW",
      recognitionStatus: "pending_review",
      accountingTreatment: "pending_review",
      reasons,
    };
  }

  if (!input.hasFutureEconomicBenefit) {
    reasons.push("Asset does not provide future economic benefit.");
  }

  if (!input.costCanBeReliablyMeasured) {
    reasons.push("Asset cost cannot be reliably measured.");
  }

  if (Number(input.usefulLifeMonths) < minimumUsefulLifeMonths) {
    reasons.push(
      `Asset useful life must be at least ${minimumUsefulLifeMonths} months.`,
    );
  }

  if (reasons.length > 0) {
    return {
      isRecognizedAsset: false,
      decision: "EXPENSE",
      recognitionStatus: "not_recognized",
      accountingTreatment: "expensed",
      reasons,
    };
  }

  if (input.cost < input.capitalizationThreshold) {
    const reason = `Asset meets recognition criteria but cost is below capitalization threshold of ${input.capitalizationThreshold}.`;

    if (lowValueAssetTreatment === "EXPENSE") {
      return {
        isRecognizedAsset: true,
        decision: "EXPENSE",
        recognitionStatus: "recognized",
        accountingTreatment: "expensed",
        reasons: [reason],
      };
    }

    return {
      isRecognizedAsset: true,
      decision: "TRACK_NON_CAPITALIZED",
      recognitionStatus: "recognized",
      accountingTreatment: "tracked_non_capitalized",
      reasons: [reason],
    };
  }

  return {
    isRecognizedAsset: true,
    decision: "CAPITALIZE",
    recognitionStatus: "recognized",
    accountingTreatment: "capitalized",
    reasons: ["Asset meets recognition and capitalization criteria."],
  };
};

export const buildAssetRecognitionPersistencePayload = (input: {
  purchaseCost: number | string;
  expectedUsefulLifeMonths?: number | null;
  hasFutureEconomicBenefit?: boolean | null;
  costCanBeReliablyMeasured?: boolean | null;
}) => {
  const policy = getDefaultCapitalizationPolicy();
  const recognition = evaluateAssetRecognition({
    cost: Number(input.purchaseCost),
    usefulLifeMonths: input.expectedUsefulLifeMonths,
    hasFutureEconomicBenefit: input.hasFutureEconomicBenefit,
    costCanBeReliablyMeasured: input.costCanBeReliablyMeasured,
    capitalizationThreshold: policy.capitalizationThreshold,
    minimumUsefulLifeMonths: policy.minimumUsefulLifeMonths,
    lowValueAssetTreatment: policy.lowValueAssetTreatment,
  });

  return {
    recognition,
    payload: {
      hasFutureEconomicBenefit: input.hasFutureEconomicBenefit ?? true,
      costCanBeReliablyMeasured: input.costCanBeReliablyMeasured ?? true,
      recognitionStatus: recognition.recognitionStatus,
      accountingTreatment: recognition.accountingTreatment,
      recognitionReasons: recognition.reasons,
      capitalizationThresholdApplied: String(policy.capitalizationThreshold),
      isDepreciable: recognition.accountingTreatment === "capitalized",
    },
  };
};
