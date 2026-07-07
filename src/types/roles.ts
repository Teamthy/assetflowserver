
export const PERMISSIONS = {
    // Assets
    ASSET_CREATE: "asset.create",
    ASSET_READ: "asset.read",
    ASSET_UPDATE: "asset.update",
    ASSET_DELETE: "asset.delete",
    ASSET_RESTORE: "asset.restore",
    ASSET_TRANSFER: "asset.transfer",
    ASSET_DISPOSE: "asset.dispose",
    ASSET_IMPORT: "asset.import",
    ASSET_EXPORT: "asset.export",

    // Branches
    BRANCH_CREATE: "branch.create",
    BRANCH_READ: "branch.read",
    BRANCH_UPDATE: "branch.update",
    BRANCH_DELETE: "branch.delete",

    // Maintenance
    MAINTENANCE_CREATE: "maintenance.create",
    MAINTENANCE_READ: "maintenance.read",
    MAINTENANCE_UPDATE: "maintenance.update",
    MAINTENANCE_COMPLETE: "maintenance.complete",

    // Finance / Accounting
    FINANCE_RECOGNITION_REVIEW: "finance.recognition.review",
    FINANCE_DEPRECIATION_CREATE: "finance.depreciation.create",
    FINANCE_DEPRECIATION_READ: "finance.depreciation.read",

    // Audit
    AUDIT_READ: "audit.read",
    AUDIT_EXPORT: "audit.export",

    // Users & Roles (org-admin scope)
    USER_INVITE: "user.invite",
    USER_READ: "user.read",
    USER_UPDATE: "user.update",
    USER_SUSPEND: "user.suspend",
    ROLE_ASSIGN: "role.assign",
    ROLE_MANAGE: "role.manage",

    // Organization settings
    ORGANIZATION_READ: "organization.read",
    ORGANIZATION_UPDATE: "organization.update",

    // Notifications
    NOTIFICATION_READ: "notification.read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];


export const SYSTEM_ROLES = {
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    FINANCE: "finance",
    MAINTENANCE: "maintenance",
    ANALYST: "analyst",
    STAFF: "staff",
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];


export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, PermissionKey[]> = {
    // Super Admin: full access to everything.
    [SYSTEM_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

    [SYSTEM_ROLES.ADMIN]: [
        PERMISSIONS.ASSET_CREATE,
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_UPDATE,
        PERMISSIONS.ASSET_TRANSFER,
        PERMISSIONS.ASSET_IMPORT,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.BRANCH_CREATE,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.BRANCH_UPDATE,
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_COMPLETE,
        PERMISSIONS.FINANCE_DEPRECIATION_READ,
        PERMISSIONS.AUDIT_READ,
        PERMISSIONS.AUDIT_EXPORT,
        PERMISSIONS.USER_READ,
        PERMISSIONS.ORGANIZATION_READ,
        PERMISSIONS.NOTIFICATION_READ,
    ],

    [SYSTEM_ROLES.FINANCE]: [
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_DISPOSE,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.FINANCE_RECOGNITION_REVIEW,
        PERMISSIONS.FINANCE_DEPRECIATION_CREATE,
        PERMISSIONS.FINANCE_DEPRECIATION_READ,
        PERMISSIONS.AUDIT_READ,
        PERMISSIONS.AUDIT_EXPORT,
        PERMISSIONS.USER_READ,
        PERMISSIONS.ORGANIZATION_READ,
        PERMISSIONS.NOTIFICATION_READ,
    ],


    [SYSTEM_ROLES.MAINTENANCE]: [
        PERMISSIONS.ASSET_CREATE,
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_UPDATE,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_COMPLETE,
        PERMISSIONS.AUDIT_READ,
        PERMISSIONS.ORGANIZATION_READ,
        PERMISSIONS.NOTIFICATION_READ,
    ],


    [SYSTEM_ROLES.ANALYST]: [
        PERMISSIONS.ASSET_CREATE,
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_IMPORT,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.FINANCE_DEPRECIATION_READ,
        PERMISSIONS.AUDIT_READ,
        PERMISSIONS.AUDIT_EXPORT,
        PERMISSIONS.USER_READ,
        PERMISSIONS.ORGANIZATION_READ,
        PERMISSIONS.NOTIFICATION_READ,
    ],

    [SYSTEM_ROLES.STAFF]: [
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_COMPLETE,
        PERMISSIONS.NOTIFICATION_READ,
    ],
};

export const SCOPE_OWN_ONLY_ROLES: SystemRole[] = [SYSTEM_ROLES.STAFF];