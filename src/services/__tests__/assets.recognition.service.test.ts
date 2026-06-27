import { evaluateAssetRecognition } from "../assets.recognition.service";

describe("asset recognition service", () => {
  it("allows useful life equal to the minimum threshold to continue to capitalization evaluation", () => {
    const result = evaluateAssetRecognition({
      cost: 75000,
      usefulLifeMonths: 12,
      hasFutureEconomicBenefit: true,
      costCanBeReliablyMeasured: true,
      capitalizationThreshold: 50000,
      minimumUsefulLifeMonths: 12,
    });

    expect(result.accountingTreatment).toBe("capitalized");
    expect(result.recognitionStatus).toBe("recognized");
  });
});
