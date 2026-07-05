import ExcelJS from "exceljs";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { listAssetsForExportBatch } from "../repositories/assets";
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
  const exportDir = path.join(os.tmpdir(), "asset-management-exports");
  await mkdir(exportDir, { recursive: true });

  const fileName = `assets-${Date.now()}-${randomUUID()}.xlsx`;
  const filePath = path.join(exportDir, fileName);
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    filename: filePath,
    useSharedStrings: true,
    useStyles: false,
  });
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

  let exportedCount = 0;
  let cursor: { createdAt: Date; id: string } | undefined;

  while (exportedCount < MAX_EXPORT_ROWS) {
    const limit = Math.min(EXPORT_PAGE_SIZE, MAX_EXPORT_ROWS - exportedCount);
    const rows = await listAssetsForExportBatch(organizationId, query, {
      limit,
      cursor,
    });

    if (rows.length === 0) {
      break;
    }

    for (const asset of rows) {
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
      }).commit();
      exportedCount += 1;
    }

    const last = rows[rows.length - 1];
    cursor = { createdAt: last.createdAt, id: last.id };

    if (rows.length < limit) {
      break;
    }
  }

  if (exportedCount >= MAX_EXPORT_ROWS) {
    logger.warn("Asset export truncated at row limit", {
      organizationId,
      limit: MAX_EXPORT_ROWS,
    });
  }

  await workbook.commit();
  logger.info("Asset export completed", { organizationId, exportedCount });
  return { filePath, fileName, exportedCount };
};
