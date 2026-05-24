import ExcelJS from "exceljs";
import { listAssets } from "../repositories/assets";
import { ExportAssetsQuery } from "../types/assets";

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
  const limit = 1000;
  let page = 1;
  const assets: Awaited<ReturnType<typeof listAssets>>["data"] = [];

  while (true) {
    const result = await listAssets(organizationId, {
      ...query,
      page,
      limit,
    });
    assets.push(...result.data);
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
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
