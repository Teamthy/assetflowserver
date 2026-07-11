import { SCHEDULER_CONFIG } from "../config/scheduler";
import {
    getActiveOrganizations,
    getAssetsWithExpiringWarranties,
} from "../repositories/scheduler";
import { notifyWarrantyExpiringSoon } from "../services/notifications";
import { logger } from "../utils/logger";

/**
 * Warranty Expiry Job
 *
 * Runs on schedule defined in SCHEDULER_CONFIG.WARRANTY_CHECK
 * For each organization, finds assets with warranties expiring soon
 * and sends notifications to organization admins.
 */
export async function runWarrantyExpiryJob(): Promise<void> {
    const { daysAhead, jobName } = SCHEDULER_CONFIG.WARRANTY_CHECK;

    logger.info(`[${jobName}] Starting warranty expiry check`, { daysAhead });

    let totalOrgs = 0;
    let totalNotified = 0;
    let totalErrors = 0;

    try {
        const organizations = await getActiveOrganizations();
        totalOrgs = organizations.length;

        logger.info(`[${jobName}] Processing ${totalOrgs} organizations`);

        for (const org of organizations) {
            try {
                const expiringAssets = await getAssetsWithExpiringWarranties(
                    org.id,
                    daysAhead
                );

                if (expiringAssets.length === 0) {
                    logger.info(`[${jobName}] No expiring warranties for org: ${org.name}`);
                    continue;
                }

                logger.info(
                    `[${jobName}] Found ${expiringAssets.length} expiring warranties for org: ${org.name}`
                );

                for (const asset of expiringAssets) {
                    try {
                        await notifyWarrantyExpiringSoon({
                            organizationId: org.id,
                            assetId: asset.id,
                            assetName: asset.name,
                            assetTag: asset.assetTag,
                            warrantyExpiryDate: asset.warrantyExpiryDate,
                        });
                        totalNotified++;
                    } catch (assetError) {
                        totalErrors++;
                        logger.error(`[${jobName}] Failed to notify for asset`, {
                            assetId: asset.id,
                            orgId: org.id,
                            error:
                                assetError instanceof Error
                                    ? assetError.message
                                    : String(assetError),
                        });
                    }
                }
            } catch (orgError) {
                totalErrors++;
                logger.error(`[${jobName}] Failed to process org`, {
                    orgId: org.id,
                    orgName: org.name,
                    error:
                        orgError instanceof Error ? orgError.message : String(orgError),
                });
            }
        }

        logger.info(`[${jobName}] Warranty expiry check complete`, {
            totalOrgs,
            totalNotified,
            totalErrors,
        });
    } catch (error) {
        logger.error(`[${jobName}] Job failed critically`, {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}