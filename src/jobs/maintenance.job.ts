import { SCHEDULER_CONFIG } from "../config/scheduler";
import { getActiveOrganizations } from "../repositories/scheduler";
import { notifyMaintenanceDueSoonService } from "../services/maintenance";
import { logger } from "../utils/logger";

/**
 * Maintenance Due Soon Job
 *
 * Runs on schedule defined in SCHEDULER_CONFIG.MAINTENANCE_DUE
 * For each organization, finds maintenance tasks due soon
 * and sends notifications to assigned staff.
 */
export async function runMaintenanceDueJob(): Promise<void> {
    const { daysAhead, jobName } = SCHEDULER_CONFIG.MAINTENANCE_DUE;

    logger.info(`[${jobName}] Starting maintenance due soon check`, {
        daysAhead,
    });

    let totalOrgs = 0;
    let totalNotified = 0;
    let totalErrors = 0;

    try {
        const organizations = await getActiveOrganizations();
        totalOrgs = organizations.length;

        logger.info(`[${jobName}] Processing ${totalOrgs} organizations`);

        for (const org of organizations) {
            try {
                const result = await notifyMaintenanceDueSoonService(
                    org.id,
                    daysAhead
                );

                totalNotified += result.notified;

                logger.info(`[${jobName}] Processed org: ${org.name}`, {
                    orgId: org.id,
                    notified: result.notified,
                });
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

        logger.info(`[${jobName}] Maintenance due check complete`, {
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