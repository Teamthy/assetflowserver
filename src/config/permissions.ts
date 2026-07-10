

export const PERMISSIONS = {

    // ─── ASSET PERMISSIONS ───────────────────────────────────────
    ASSET_CREATE: "asset:create",
    ASSET_READ: "asset:read",
    ASSET_UPDATE: "asset:update",
    ASSET_DELETE: "asset:delete",
    ASSET_RESTORE: "asset:restore",
    ASSET_TRANSFER: "asset:transfer",
    ASSET_DISPOSE: "asset:dispose",
    ASSET_IMPORT: "asset:import",
    ASSET_EXPORT: "asset:export",
    ASSET_AUDIT: "asset:audit",

    // ─── DEPRECIATION PERMISSIONS ────────────────────────────────
    DEPRECIATION_RECORD: "depreciation:record",

    // ─── BRANCH PERMISSIONS ──────────────────────────────────────
    BRANCH_CREATE: "branch:create",
    BRANCH_READ: "branch:read",
    BRANCH_UPDATE: "branch:update",
    BRANCH_DELETE: "branch:delete",

    // ─── MAINTENANCE PERMISSIONS ─────────────────────────────────
    MAINTENANCE_CREATE: "maintenance:create",
    MAINTENANCE_READ: "maintenance:read",
    MAINTENANCE_UPDATE: "maintenance:update",
    MAINTENANCE_COMPLETE: "maintenance:complete",

    // ─── NOTIFICATION PERMISSIONS ────────────────────────────────
    NOTIFICATION_READ: "notification:read",
    NOTIFICATION_MANAGE: "notification:manage",

    // ─── ORGANIZATION PERMISSIONS ────────────────────────────────
    ORG_SETTINGS_READ: "org:settings:read",
    ORG_SETTINGS_UPDATE: "org:settings:update",

    // ─── USER & ROLE PERMISSIONS ─────────────────────────────────
    USER_INVITE: "user:invite",
    USER_READ: "user:read",
    USER_UPDATE: "user:update",
    USER_SUSPEND: "user:suspend",
    ROLE_ASSIGN: "role:assign",
    ROLE_READ: "role:read",

} as const;

// Type for all permission keys
export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Role Names
 * These are the system role names seeded into every organization.
 */
export const SYSTEM_ROLES = {
    ADMIN: "admin",
    ASSET_MANAGER: "asset_manager",
    FINANCE: "finance",
    AUDITOR: "auditor",
    BRANCH_MANAGER: "branch_manager",
    MAINTENANCE_STAFF: "maintenance_staff",
    STANDARD_STAFF: "standard_staff",
} as const;

export type SystemRoleName = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

/**
 * Role Permission Matrix
 * Defines what each system role can do.
 */
export const ROLE_PERMISSIONS: Record<SystemRoleName, PermissionKey[]> = {

    // ─── ADMIN ───────────────────────────────────────────────────
    [SYSTEM_ROLES.ADMIN]: [
        PERMISSIONS.ASSET_CREATE,
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_UPDATE,
        PERMISSIONS.ASSET_DELETE,
        PERMISSIONS.ASSET_RESTORE,
        PERMISSIONS.ASSET_TRANSFER,
        PERMISSIONS.ASSET_DISPOSE,
        PERMISSIONS.ASSET_IMPORT,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.ASSET_AUDIT,
        PERMISSIONS.DEPRECIATION_RECORD,
        PERMISSIONS.BRANCH_CREATE,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.BRANCH_UPDATE,
        PERMISSIONS.BRANCH_DELETE,
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_COMPLETE,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.NOTIFICATION_MANAGE,
        PERMISSIONS.ORG_SETTINGS_READ,
        PERMISSIONS.ORG_SETTINGS_UPDATE,
        PERMISSIONS.USER_INVITE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_UPDATE,
        PERMISSIONS.USER_SUSPEND,
        PERMISSIONS.ROLE_ASSIGN,
        PERMISSIONS.ROLE_READ,
    ],

    // ─── ASSET MANAGER ───────────────────────────────────────────
    [SYSTEM_ROLES.ASSET_MANAGER]: [
        PERMISSIONS.ASSET_CREATE,
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_UPDATE,
        PERMISSIONS.ASSET_DELETE,
        PERMISSIONS.ASSET_RESTORE,
        PERMISSIONS.ASSET_TRANSFER,
        PERMISSIONS.ASSET_DISPOSE,
        PERMISSIONS.ASSET_IMPORT,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.ASSET_AUDIT,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_COMPLETE,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.USER_READ,
    ],

    // ─── FINANCE ─────────────────────────────────────────────────
    [SYSTEM_ROLES.FINANCE]: [
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.ASSET_AUDIT,
        PERMISSIONS.ASSET_DISPOSE,
        PERMISSIONS.DEPRECIATION_RECORD,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.ORG_SETTINGS_READ,
    ],

    // ─── AUDITOR ─────────────────────────────────────────────────
    [SYSTEM_ROLES.AUDITOR]: [
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.ASSET_AUDIT,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.ORG_SETTINGS_READ,
    ],

    // ─── BRANCH MANAGER ──────────────────────────────────────────
    [SYSTEM_ROLES.BRANCH_MANAGER]: [
        PERMISSIONS.ASSET_CREATE,
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_UPDATE,
        PERMISSIONS.ASSET_TRANSFER,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.BRANCH_UPDATE,
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_COMPLETE,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.USER_READ,
    ],

    // ─── MAINTENANCE STAFF ───────────────────────────────────────
    [SYSTEM_ROLES.MAINTENANCE_STAFF]: [
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_COMPLETE,
        PERMISSIONS.NOTIFICATION_READ,
    ],

    // ─── STANDARD STAFF ──────────────────────────────────────────
    [SYSTEM_ROLES.STANDARD_STAFF]: [
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.NOTIFICATION_READ,
    ],

};