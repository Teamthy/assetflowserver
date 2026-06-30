import ExcelJS from "exceljs";
import { listAssets } from "../repositories/assets";
import { ExportAssetsQuery } from "../types/assets";
import { logger } from "../utils/logger";

const MAX_EXPORT_ROWS = 10_000;
const EXPORT_PAGE_SIZE = 1000;

const toIsoString = (value: unknown): string => {
  if (!value) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  }
  return "";
};

export const exportAssetsWorkbook = async (
  organizationId: string,
  query: ExportAssetsQuery,
) => {
  logger.info("Asset export started", { organizationId });
  let page = 1;
  const assets: Awaited<ReturnType<typeof listAssets>>["data"] = [];

  while (assets.length < MAX_EXPORT_ROWS) {
    const limit = Math.min(EXPORT_PAGE_SIZE, MAX_EXPORT_ROWS - assets.length);
    const result = await listAssets(organizationId, {
      ...query,
      page,
      limit,
    });
    assets.push(...result.data);

    if (assets.length >= MAX_EXPORT_ROWS && page < result.pagination.totalPages) {
      logger.warn("Asset export truncated at row limit", {
        organizationId,
        limit: MAX_EXPORT_ROWS,
      });
      break;
    }

    if (page >= result.pagination.totalPages) {
      break;
    }
    page += 1;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Assets");

  sheet.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Asset Tag", key: "assetTag", width: 20 },
    { header: "Serial Number", key: "serialNumber", width: 22 },
    { header: "Status", key: "status", width: 14 },
    { header: "Condition", key: "condition", width: 14 },
    { header: "Category", key: "category", width: 18 },
    { header: "Purchase Cost", key: "purchaseCost", width: 16 },
    { header: "Purchase Date", key: "purchaseDate", width: 24 },
    { header: "Useful Life Months", key: "expectedUsefulLifeMonths", width: 20 },
    { header: "Future Economic Benefit", key: "hasFutureEconomicBenefit", width: 24 },
    { header: "Cost Reliably Measured", key: "costCanBeReliablyMeasured", width: 24 },
    { header: "Recognition Status", key: "recognitionStatus", width: 22 },
    { header: "Accounting Treatment", key: "accountingTreatment", width: 24 },
    { header: "Capitalization Threshold", key: "capitalizationThresholdApplied", width: 24 },
    { header: "Recognition Reasons", key: "recognitionReasons", width: 60 },
  ];

  for (const asset of assets) {
    sheet.addRow({
      name: asset.name,
      assetTag: asset.assetTag,
      serialNumber: asset.serialNumber,
      status: asset.status,
      condition: asset.condition,
      category: asset.category,
      purchaseCost: asset.purchaseCost,
      purchaseDate: toIsoString(asset.purchaseDate),
      expectedUsefulLifeMonths: asset.expectedUsefulLifeMonths,
      hasFutureEconomicBenefit: asset.hasFutureEconomicBenefit,
      costCanBeReliablyMeasured: asset.costCanBeReliablyMeasured,
      recognitionStatus: asset.recognitionStatus,
      accountingTreatment: asset.accountingTreatment,
      capitalizationThresholdApplied: asset.capitalizationThresholdApplied,
      recognitionReasons: asset.recognitionReasons.join("; "),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  logger.info("Asset export completed", { organizationId, exportedCount: assets.length });
  return Buffer.from(buffer);
};
