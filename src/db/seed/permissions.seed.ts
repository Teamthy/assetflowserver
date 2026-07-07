import { upsertPermissions } from "../../repositories/roles";
import { PERMISSIONS } from "../../types/roles";
import { logger } from "../../utils/logger";


const PERMISSION_DESCRIPTIONS: Record<string, string> = {
    [PERMISSIONS.ASSET_CREATE]: "Create new asset records",
    [PERMISSIONS.ASSET_READ]: "View assets",
    [PERMISSIONS.ASSET_UPDATE]: "Update asset details",
    [PERMISSIONS.ASSET_DELETE]: "Soft-delete assets",
    [PERMISSIONS.ASSET_RESTORE]: "Restore deleted or disposed assets",
    [PERMISSIONS.ASSET_TRANSFER]: "Transfer assets between branches or users",
    [PERMISSIONS.ASSET_DISPOSE]: "Dispose of assets (sold, donated, scrapped, etc.)",
    [PERMISSIONS.ASSET_IMPORT]: "Import assets from spreadsheet",
    [PERMISSIONS.ASSET_EXPORT]: "Export assets to spreadsheet",

    [PERMISSIONS.BRANCH_CREATE]: "Create branches",
    [PERMISSIONS.BRANCH_READ]: "View branches",
    [PERMISSIONS.BRANCH_UPDATE]: "Update branch details",
    [PERMISSIONS.BRANCH_DELETE]: "Delete branches",

    [PERMISSIONS.MAINTENANCE_CREATE]: "Create maintenance tasks",
    [PERMISSIONS.MAINTENANCE_READ]: "View maintenance tasks",
    [PERMISSIONS.MAINTENANCE_UPDATE]: "Update maintenance tasks",
    [PERMISSIONS.MAINTENANCE_COMPLETE]: "Mark maintenance tasks as complete",

    [PERMISSIONS.FINANCE_RECOGNITION_REVIEW]: "Review pending asset recognition decisions",
    [PERMISSIONS.FINANCE_DEPRECIATION_CREATE]: "Record depreciation snapshots",
    [PERMISSIONS.FINANCE_DEPRECIATION_READ]: "View depreciation history",

    [PERMISSIONS.AUDIT_READ]: "View audit summaries and lifecycle history",
    [PERMISSIONS.AUDIT_EXPORT]: "Export audit reports",

    [PERMISSIONS.USER_INVITE]: "Invite new users to the organization",
    [PERMISSIONS.USER_READ]: "View organization members",
    [PERMISSIONS.USER_UPDATE]: "Update user details",
    [PERMISSIONS.USER_SUSPEND]: "Suspend or reactivate users",
    [PERMISSIONS.ROLE_ASSIGN]: "Assign roles to users",
    [PERMISSIONS.ROLE_MANAGE]: "Create and manage custom roles",

    [PERMISSIONS.ORGANIZATION_READ]: "View organization settings",
    [PERMISSIONS.ORGANIZATION_UPDATE]: "Update organization settings and policies",
};


export const seedPermissions = async () => {
    const entries = Object.values(PERMISSIONS).map((key) => ({
        key,
        description: PERMISSION_DESCRIPTIONS[key] ?? key,
    }));

    await upsertPermissions(entries);
    logger.info(`Seeded ${entries.length} permissions`);
};