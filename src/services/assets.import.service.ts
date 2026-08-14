import ExcelJS from "exceljs";
import { env } from "../config/env";
import { bulkCreateAssetsAtomic } from "../repositories/assets";
import { listBranches } from "../repositories/branches";
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
  inserted: number;
  failed: number;
  successCount: number;
  failures: Array<{ row: number; message: string }>;
  successfulRows: Array<{
    row: number;
    assetName: string;
    assetTag: string;
    decision: string;
    accountingTreatment: string;
    reasons: string[];
  }>;
  recognitionSummary: Record<string, number>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const emptyImportResult = (overrides: Partial<ImportResult> = {}): ImportResult => ({
  totalRows: 0,
  insertedCount: 0,
  failedCount: 0,
  inserted: 0,
  failed: 0,
  successCount: 0,
  failures: [],
  successfulRows: [],
  recognitionSummary: {},
  ...overrides,
});

const finalizeImportResult = (result: ImportResult): ImportResult => {
  result.inserted = result.insertedCount;
  result.failed = result.failedCount;
  result.successCount = result.insertedCount;
  result.recognitionSummary = result.successfulRows.reduce<Record<string, number>>(
    (summary, row) => {
      const key = row.accountingTreatment || "unknown";
      summary[key] = (summary[key] ?? 0) + 1;
      return summary;
    },
    {},
  );
  return result;
};

type AssetImportPayload = Parameters<typeof bulkCreateAssetsAtomic>[2][number];
const MAX_FAILURE_DETAILS = 200;

const addFailure = (
  result: ImportResult,
  failure: { row: number; message: string },
) => {
  result.failedCount += 1;
  if (result.failures.length < MAX_FAILURE_DETAILS) {
    result.failures.push(failure);
  }
};

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
  const workbook = new ExcelJS.Workbook();
  const bytes = new Uint8Array(fileBuffer);
  await workbook.xlsx.load(bytes as never);
  return importAssetsFromWorkbook(organizationId, actorUserId, workbook);
};

export const importAssetsFromExcelFile = async (
  organizationId: string,
  actorUserId: string,
  filePath: string,
): Promise<ImportResult> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return importAssetsFromWorkbook(organizationId, actorUserId, workbook);
};

const importAssetsFromWorkbook = async (
  organizationId: string,
  actorUserId: string,
  workbook: ExcelJS.Workbook,
): Promise<ImportResult> => {
  logger.info("Asset import started", { organizationId, actorUserId });
  const organization = await findOrganizationById(organizationId);
  if (!organization) {
    throw new ValidationError("Validation failed", [
      { path: ["organizationId"], message: "Organization not found" },
    ]);
  }

  const sheet =
    workbook.getWorksheet("Assets") ??
    workbook.worksheets.find((item) => item.name.trim().toLowerCase() === "assets") ??
    workbook.worksheets[0];

  if (!sheet) {
    return finalizeImportResult(
      emptyImportResult({
        failedCount: 1,
        failures: [{ row: 0, message: "Worksheet not found" }],
      }),
    );
  }

  const importableRowCount = Math.max(0, sheet.actualRowCount - 1);
  const rowsToRead = Math.min(importableRowCount, env.ASSET_IMPORT_MAX_ROWS);
  const rows = sheet
    .getRows(2, rowsToRead)
    ?.filter((row) => row.actualCellCount > 0) ?? [];

  const orgBranches = await listBranches(organizationId);
  const defaultBranchId = orgBranches[0]?.id;
  const resolveBranchId = (raw?: string): string | undefined => {
    if (!raw) {
      return organization.multiBranchEnabled ? defaultBranchId : undefined;
    }
    if (UUID_RE.test(raw)) {
      return orgBranches.find((branch) => branch.id === raw)?.id ?? raw;
    }
    const needle = raw.trim().toLowerCase();
    const named = orgBranches.find(
      (branch) =>
        branch.name.toLowerCase() === needle ||
        (branch.code ?? "").toLowerCase() === needle,
    );
    if (named) return named.id;
    return organization.multiBranchEnabled ? defaultBranchId : undefined;
  };

  const result = emptyImportResult({ totalRows: importableRowCount });

  if (importableRowCount > env.ASSET_IMPORT_MAX_ROWS) {
    result.failedCount += importableRowCount - env.ASSET_IMPORT_MAX_ROWS;
    if (result.failures.length < MAX_FAILURE_DETAILS) {
      result.failures.push({
      row: env.ASSET_IMPORT_MAX_ROWS + 2,
      message: `Import limited to ${env.ASSET_IMPORT_MAX_ROWS} data rows per file`,
      });
    }
  }
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
      addFailure(result, {
        row: row.number,
        message: parsed.error.issues.map((i) => i.message).join(", "),
      });
      continue;
    }

    const resolvedBranchId = resolveBranchId(parsed.data.branchId);
    if (organization.multiBranchEnabled && !resolvedBranchId) {
      addFailure(result, {
        row: row.number,
        message:
          "No branch found. Create a branch first, or put a branch name/code/UUID in the Branch ID column.",
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
        branchId: resolvedBranchId,
        status: parsed.data.status ?? "active",
        condition: "good",
        ...recognitionPayload.payload,
      } as AssetImportPayload,
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
      for (const entry of validRows) {
        addFailure(result, {
          row: entry.row,
          message,
        });
      }
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

  return finalizeImportResult(result);
};
