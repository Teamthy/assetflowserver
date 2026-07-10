
export const SCHEDULER_CONFIG = {
    /**
     * Warranty expiry check
     * Runs every day at 8:00 AM
     * Notifies admins of assets with warranties expiring within X days
     */
    WARRANTY_CHECK: {
        cronExpression: "0 8 * * *",
        jobName: "warranty-expiry-check",
        daysAhead: 30,
        enabled: true,
    },

    /**
     * Maintenance due soon check
     * Runs every day at 8:30 AM
     * Notifies assignees of maintenance tasks due within X days
     */
    MAINTENANCE_DUE: {
        cronExpression: "30 8 * * *",
        jobName: "maintenance-due-check",
        daysAhead: 7,
        enabled: true,
    },
} as const;