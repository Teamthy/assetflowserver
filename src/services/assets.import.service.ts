import ExcelJS from "exceljs";
import { bulkCreateAssetsAtomic } from "../repositories/assets";
import { findOrganizationById } from "../repositories/organizations";
import { ValidationError } from "../utils/error";
import { logger } from "../utils/logger";
import { importAssetRowSchema } from "../validators/assets";
import { createInAppNotification } from "./notifications";
import { buildAssetRecognitionPersistencePayload } from "./assets.recognition.service";

type ImportResult = {
  totalRows: number;
  insertedCount: number;
  failedCount: number;
  failures: Array<{ row: number; message: string }>;
  successfulRows: Array<{
    row: number;
    assetName: string;
    assetTag: string;
    decision: string;
    accountingTreatment: string;
    reasons: string[];
  }>;
};

type AssetImportPayload = Parameters<typeof bulkCreateAssetsAtomic>[2][number];

const unwrapExcelCellValue = (value: ExcelJS.CellValue): unknown => {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "object") {
    if ("result" in value && value.result !== undefined && value.result !== null) {
      return unwrapExcelCellValue(value.result as ExcelJS.CellValue);
    }
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
  }

  return undefined;
};

const readCellString = (value: ExcelJS.CellValue): string | undefined => {
  const unwrapped = unwrapExcelCellValue(value);
  if (unwrapped === undefined || unwrapped === null) return undefined;
  const text = String(unwrapped).trim();
  return text.length > 0 ? text : undefined;
};

const readCellNumber = (value: ExcelJS.CellValue): number | undefined => {
  const unwrapped = unwrapExcelCellValue(value);
  if (typeof unwrapped === "number") return unwrapped;
  if (typeof unwrapped === "string") {
    const parsed = Number(unwrapped);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const readCellBoolean = (value: ExcelJS.CellValue): boolean | undefined => {
  const unwrapped = unwrapExcelCellValue(value);
  if (typeof unwrapped === "boolean") return unwrapped;
  if (typeof unwrapped === "number") return unwrapped === 1;
  if (typeof unwrapped !== "string") return undefined;

  const normalized = unwrapped.trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0"].includes(normalized)) return false;
  return undefined;
};

const readCellIsoDate = (value: ExcelJS.CellValue): string | undefined => {
  const unwrapped = unwrapExcelCellValue(value);
  if (unwrapped instanceof Date && !Number.isNaN(unwrapped.getTime())) {
    return unwrapped.toISOString();
  }
  if (typeof unwrapped === "string" || typeof unwrapped === "number") {
    const parsed = new Date(unwrapped);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return undefined;
};

export const importAssetsFromExcel = async (
  organizationId: string,
  actorUserId: string,
  fileBuffer: Buffer<ArrayBufferLike>,
): Promise<ImportResult> => {
  logger.info("Asset import started", { organizationId, actorUserId });
  const organization = await findOrganizationById(organizationId);
  if (!organization) {
    throw new ValidationError("Validation failed", [
      { path: ["organizationId"], message: "Organization not found" },
    ]);
  }

  const workbook = new ExcelJS.Workbook();
  const bytes = new Uint8Array(fileBuffer);
  await workbook.xlsx.load(bytes as never);
  const sheet = workbook.worksheets[0];

  if (!sheet) {
    return {
      totalRows: 0,
      insertedCount: 0,
      failedCount: 1,
      failures: [{ row: 0, message: "Worksheet not found" }],
      successfulRows: [],
    };
  }

  const rows = sheet
    .getRows(2, Math.max(0, sheet.actualRowCount - 1))
    ?.filter((row) => row.actualCellCount > 0) ?? [];
  const result: ImportResult = {
    totalRows: rows.length,
    insertedCount: 0,
    failedCount: 0,
    failures: [],
    successfulRows: [],
  };
  const validRows: Array<{
    row: number;
    payload: AssetImportPayload;
    recognition: ReturnType<typeof buildAssetRecognitionPersistencePayload>["recognition"];
  }> = [];

  for (const row of rows) {
    const rowData = {
      name: readCellString(row.getCell(1).value),
      assetTag: readCellString(row.getCell(2).value),
      serialNumber: readCellString(row.getCell(3).value),
      purchaseCost: readCellNumber(row.getCell(4).value),
      purchaseDate: readCellIsoDate(row.getCell(5).value),
      branchId: readCellString(row.getCell(6).value),
      assignedTo: readCellString(row.getCell(7).value),
      status: readCellString(row.getCell(8).value),
      expectedUsefulLifeMonths: readCellNumber(row.getCell(9).value),
      hasFutureEconomicBenefit: readCellBoolean(row.getCell(10).value),
      costCanBeReliablyMeasured: readCellBoolean(row.getCell(11).value),
    };

    const parsed = importAssetRowSchema.safeParse(rowData);
    if (!parsed.success) {
      result.failedCount += 1;
      result.failures.push({
        row: row.number,
        message: parsed.error.issues.map((i) => i.message).join(", "),
      });
      continue;
    }

    if (organization.multiBranchEnabled && !parsed.data.branchId) {
      result.failedCount += 1;
      result.failures.push({
        row: row.number,
        message:
          "branchId is required when multi-branch mode is enabled for this organization",
      });
      continue;
    }

    const recognitionPayload = buildAssetRecognitionPersistencePayload({
      purchaseCost: parsed.data.purchaseCost,
      expectedUsefulLifeMonths: parsed.data.expectedUsefulLifeMonths,
      hasFutureEconomicBenefit: parsed.data.hasFutureEconomicBenefit,
      costCanBeReliablyMeasured: parsed.data.costCanBeReliablyMeasured,
    });

    validRows.push({
      row: row.number,
      payload: {
        ...parsed.data,
        status: parsed.data.status ?? "active",
        condition: "good",
        ...recognitionPayload.payload,
      },
      recognition: recognitionPayload.recognition,
    });
  }

  if (validRows.length > 0) {
    try {
      await bulkCreateAssetsAtomic(
        organizationId,
        actorUserId,
        validRows.map((entry) => entry.payload),
      );
      result.insertedCount = validRows.length;
      result.successfulRows.push(
        ...validRows.map((entry) => ({
          row: entry.row,
          assetName: entry.payload.name,
          assetTag: entry.payload.assetTag,
          decision: entry.recognition.decision,
          accountingTreatment: entry.recognition.accountingTreatment,
          reasons: entry.recognition.reasons,
        })),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bulk insert failed";
      result.failedCount += validRows.length;
      result.failures.push(
        ...validRows.map((entry) => ({
          row: entry.row,
          message,
        })),
      );
    }
  }

  logger.info("Asset import completed", {
    organizationId,
    actorUserId,
    totalRows: result.totalRows,
    insertedCount: result.insertedCount,
    failedCount: result.failedCount,
  });

  await createInAppNotification({
    organizationId,
    userId: actorUserId,
    type: "system_alert",
    title: "Asset import completed",
    message: `${result.insertedCount} asset(s) imported. ${result.failedCount} row(s) failed.`,
    metadata: {
      totalRows: result.totalRows,
      insertedCount: result.insertedCount,
      failedCount: result.failedCount,
      redirectUrl: "/assets",
    },
  });

  return result;
};
