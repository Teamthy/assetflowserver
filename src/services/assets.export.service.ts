import ExcelJS from "exceljs";
import { listAssets } from "../repositories/assets";
import { ExportAssetsQuery } from "../types/assets";

export const exportAssetsWorkbook = async (
  organizationId: string,
  query: ExportAssetsQuery,
) => {
  const result = await listAssets(organizationId, {
    ...query,
    page: 1,
    limit: 10000,
  });

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

  for (const asset of result.data) {
    sheet.addRow({
      name: asset.name,
      assetTag: asset.assetTag,
      serialNumber: asset.serialNumber,
      status: asset.status,
      condition: asset.condition,
      category: asset.category,
      purchaseCost: asset.purchaseCost,
      purchaseDate: asset.purchaseDate?.toISOString?.() ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
