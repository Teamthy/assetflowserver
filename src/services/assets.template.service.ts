import ExcelJS from "exceljs";
import { logger } from "../utils/logger";

/**
 * Generate a downloadable import template workbook.
 * Returns a buffer that can be sent directly to the client.
 */
export async function generateImportTemplate(): Promise<Buffer> {
    logger.info("Generating asset import template");

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Assets");

    // ─── Column Definitions ──────────────────────────────────────
    sheet.columns = [
        { header: "Name *", key: "name", width: 30 },
        { header: "Asset Tag *", key: "assetTag", width: 20 },
        { header: "Serial Number", key: "serialNumber", width: 22 },
        { header: "Purchase Cost *", key: "purchaseCost", width: 18 },
        { header: "Purchase Date (YYYY-MM-DD)", key: "purchaseDate", width: 28 },
        { header: "Branch ID", key: "branchId", width: 38 },
        { header: "Assigned To (User ID)", key: "assignedTo", width: 38 },
        { header: "Status (active/maintenance)", key: "status", width: 28 },
        { header: "Useful Life (Months)", key: "expectedUsefulLifeMonths", width: 22 },
        { header: "Future Economic Benefit (true/false)", key: "hasFutureEconomicBenefit", width: 38 },
        { header: "Cost Reliably Measured (true/false)", key: "costCanBeReliablyMeasured", width: 38 },
    ];

    // ─── Style Header Row ─────────────────────────────────────────
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1D4ED8" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
            bottom: { style: "thin", color: { argb: "FF000000" } },
        };
    });
    headerRow.height = 24;

    // ─── Example Row 1 ───────────────────────────────────────────
    sheet.addRow({
        name: "Dell Laptop XPS 15",
        assetTag: "ASSET-001",
        serialNumber: "SN-12345",
        purchaseCost: 250000,
        purchaseDate: "2024-01-15",
        branchId: "",
        assignedTo: "",
        status: "active",
        expectedUsefulLifeMonths: 36,
        hasFutureEconomicBenefit: true,
        costCanBeReliablyMeasured: true,
    });

    // ─── Example Row 2 ───────────────────────────────────────────
    sheet.addRow({
        name: "Office Chair Executive",
        assetTag: "ASSET-002",
        serialNumber: "",
        purchaseCost: 45000,
        purchaseDate: "2024-02-01",
        branchId: "",
        assignedTo: "",
        status: "active",
        expectedUsefulLifeMonths: 60,
        hasFutureEconomicBenefit: true,
        costCanBeReliablyMeasured: true,
    });

    // ─── Style Example Rows ───────────────────────────────────────
    [2, 3].forEach((rowNum) => {
        const row = sheet.getRow(rowNum);
        row.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF0F9FF" },
            };
        });
    });

    // ─── Instructions Sheet ───────────────────────────────────────
    const instructionsSheet = workbook.addWorksheet("Instructions");
    instructionsSheet.getColumn(1).width = 80;

    const instructions = [
        ["AssetFlow — Asset Import Template Instructions"],
        [""],
        ["REQUIRED FIELDS (marked with *)"],
        ["  • Name: Asset name (max 180 characters)"],
        ["  • Asset Tag: Unique identifier within your organization (max 120 characters)"],
        ["  • Purchase Cost: Numeric value, must be 0 or greater (e.g. 250000)"],
        [""],
        ["OPTIONAL FIELDS"],
        ["  • Serial Number: Unique serial number (leave blank if not available)"],
        ["  • Purchase Date: Format YYYY-MM-DD (e.g. 2024-01-15)"],
        ["  • Branch ID: UUID of the branch (required if multi-branch mode is enabled)"],
        ["  • Assigned To: UUID of the user to assign this asset to"],
        ["  • Status: Use 'active' or 'maintenance' (defaults to 'active' if blank)"],
        ["  • Useful Life (Months): Integer value (e.g. 36 for 3 years)"],
        ["  • Future Economic Benefit: true or false (defaults to true)"],
        ["  • Cost Reliably Measured: true or false (defaults to true)"],
        [""],
        ["NOTES"],
        ["  • Maximum 5,000 rows per import file"],
        ["  • Delete the two example rows before importing"],
        ["  • Do not modify the header row"],
        ["  • Save the file as .xlsx format before uploading"],
        ["  • Assets below NGN 50,000 will be tracked as non-capitalized"],
        ["  • Assets above NGN 50,000 with 12+ months useful life will be capitalized"],
    ];

    instructions.forEach((row, index) => {
        const excelRow = instructionsSheet.getRow(index + 1);
        excelRow.getCell(1).value = row[0] ?? "";

        if (index === 0) {
            excelRow.getCell(1).font = { bold: true, size: 14 };
        } else if (
            row[0]?.startsWith("REQUIRED") ||
            row[0]?.startsWith("OPTIONAL") ||
            row[0]?.startsWith("NOTES")
        ) {
            excelRow.getCell(1).font = { bold: true };
        }
    });

    // ─── Write To Buffer ──────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    logger.info("Asset import template generated successfully");

    return Buffer.from(buffer);
}