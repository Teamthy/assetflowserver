import QRCode from "qrcode";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../db";
import { assets } from "../model/asset";
import { NotFoundError, ValidationError } from "../utils/error";
import { logger } from "../utils/logger";
import { env } from "../config/env";

/**
 * Generate a QR code data URL for an asset.
 * The QR code encodes the asset's public URL.
 * Also persists the QR code URL to the asset record.
 */
export async function generateAssetQrCode(
    organizationId: string,
    assetId: string
): Promise<{
    assetId: string;
    assetTag: string;
    qrCodeDataUrl: string;
    qrCodeUrl: string;
}> {
    // Fetch the asset
    const [asset] = await db
        .select({
            id: assets.id,
            assetTag: assets.assetTag,
            organizationId: assets.organizationId,
            qrCodeUrl: assets.qrCodeUrl,
        })
        .from(assets)
        .where(
            and(
                eq(assets.id, assetId),
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt)
            )
        )
        .limit(1);

    if (!asset) {
        throw new NotFoundError("Asset");
    }

    // Build the asset URL
    const assetUrl = `${env.FRONTEND_URL}/assets/${assetId}`;

    // Generate QR code as data URL (PNG base64)
    const qrCodeDataUrl = await QRCode.toDataURL(assetUrl, {
        errorCorrectionLevel: "M",
        type: "image/png",
        margin: 2,
        width: 300,
        color: {
            dark: "#000000",
            light: "#FFFFFF",
        },
    });

    // Persist the QR code URL to the asset if not already set
    if (!asset.qrCodeUrl) {
        await db
            .update(assets)
            .set({
                qrCodeUrl: assetUrl,
                updatedAt: new Date(),
            })
            .where(eq(assets.id, assetId));
    }

    logger.info("[QR] Generated QR code for asset", {
        assetId,
        assetTag: asset.assetTag,
        organizationId,
    });

    return {
        assetId,
        assetTag: asset.assetTag,
        qrCodeDataUrl,
        qrCodeUrl: assetUrl,
    };
}

/**
 * Generate QR codes for multiple assets in bulk.
 * Returns results for each asset including success/failure.
 */
export async function generateBulkQrCodes(
    organizationId: string,
    assetIds: string[]
): Promise<{
    successful: Array<{
        assetId: string;
        assetTag: string;
        qrCodeDataUrl: string;
        qrCodeUrl: string;
    }>;
    failed: Array<{
        assetId: string;
        reason: string;
    }>;
}> {
    if (assetIds.length === 0) {
        throw new ValidationError("Validation failed", [
            { path: ["assetIds"], message: "At least one asset ID is required" },
        ]);
    }

    if (assetIds.length > 100) {
        throw new ValidationError("Validation failed", [
            { path: ["assetIds"], message: "Maximum 100 assets per bulk QR generation" },
        ]);
    }

    // Fetch all requested assets
    const foundAssets = await db
        .select({
            id: assets.id,
            assetTag: assets.assetTag,
            organizationId: assets.organizationId,
            qrCodeUrl: assets.qrCodeUrl,
        })
        .from(assets)
        .where(
            and(
                inArray(assets.id, assetIds),
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt)
            )
        );

    const foundIds = new Set(foundAssets.map((a) => a.id));
    const successful: Array<{
        assetId: string;
        assetTag: string;
        qrCodeDataUrl: string;
        qrCodeUrl: string;
    }> = [];

    const failed: Array<{ assetId: string; reason: string }> = [];

    // Report missing assets
    for (const id of assetIds) {
        if (!foundIds.has(id)) {
            failed.push({ assetId: id, reason: "Asset not found" });
        }
    }

    // Generate QR codes for found assets
    for (const asset of foundAssets) {
        try {
            const assetUrl = `${env.FRONTEND_URL}/assets/${asset.id}`;

            const qrCodeDataUrl = await QRCode.toDataURL(assetUrl, {
                errorCorrectionLevel: "M",
                type: "image/png",
                margin: 2,
                width: 300,
            });

            // Update qrCodeUrl if not set
            if (!asset.qrCodeUrl) {
                await db
                    .update(assets)
                    .set({ qrCodeUrl: assetUrl, updatedAt: new Date() })
                    .where(eq(assets.id, asset.id));
            }

            successful.push({
                assetId: asset.id,
                assetTag: asset.assetTag,
                qrCodeDataUrl,
                qrCodeUrl: assetUrl,
            });
        } catch (error) {
            failed.push({
                assetId: asset.id,
                reason:
                    error instanceof Error ? error.message : "QR generation failed",
            });
        }
    }

    logger.info("[QR] Bulk QR generation complete", {
        organizationId,
        requested: assetIds.length,
        successful: successful.length,
        failed: failed.length,
    });

    return { successful, failed };
}

/**
 * Scan/lookup an asset by its QR code URL or asset ID.
 * Used by the scan-to-asset workflow.
 */
export async function scanAssetQrCode(
    organizationId: string,
    assetId: string
): Promise<{
    id: string;
    name: string;
    assetTag: string;
    status: string;
    condition: string;
    category: string | null;
    assignedTo: string | null;
    branchId: string | null;
    qrCodeUrl: string | null;
}> {
    const [asset] = await db
        .select({
            id: assets.id,
            name: assets.name,
            assetTag: assets.assetTag,
            status: assets.status,
            condition: assets.condition,
            category: assets.category,
            assignedTo: assets.assignedTo,
            branchId: assets.branchId,
            qrCodeUrl: assets.qrCodeUrl,
        })
        .from(assets)
        .where(
            and(
                eq(assets.id, assetId),
                eq(assets.organizationId, organizationId),
                isNull(assets.deletedAt)
            )
        )
        .limit(1);

    if (!asset) {
        throw new NotFoundError("Asset");
    }

    logger.info("[QR] Asset scanned", {
        assetId,
        assetTag: asset.assetTag,
        organizationId,
    });

    return asset;
}