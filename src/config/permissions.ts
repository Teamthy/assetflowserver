// ─────────────────────────────────────────────────────────────────────────────
// ASSETFLOW PERMISSION CONFIGURATION
// Version: 2.1 — Aligned with Approved Permission Matrix v1.0
// Last Updated: 2026-07-13
//
// This file is the single source of truth for:
//   - All permission keys in the system
//   - All system role names
//   - The permission set assigned to each system role
//
// Rules:
//   - Never remove a key without a migration to clean up the DB
//   - Never rename a key without a migration
//   - Add new keys here first, then seed, then use in routes
//   - ROLE_PERMISSIONS must stay in sync with the approved matrix
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — ALL PERMISSION KEYS
// ─────────────────────────────────────────────────────────────────────────────

export const PERMISSIONS = {

    // ─── ASSET ───────────────────────────────────────────────────────────────
    ASSET_CREATE: "asset:create",
    ASSET_READ: "asset:read",
    ASSET_UPDATE: "asset:update",
    ASSET_DELETE: "asset:delete",
    ASSET_RESTORE: "asset:restore",
    ASSET_TRANSFER: "asset:transfer",
    ASSET_DISPOSE: "asset:dispose",
    ASSET_DISPOSE_APPROVE: "asset:dispose:approve",
    ASSET_IMPORT: "asset:import",
    ASSET_EXPORT: "asset:export",
    ASSET_AUDIT: "asset:audit",

    // ─── DEPRECIATION ────────────────────────────────────────────────────────
    DEPRECIATION_RECORD: "depreciation:record",
    DEPRECIATION_EDIT: "depreciation:edit",
    DEPRECIATION_DELETE: "depreciation:delete",
    DEPRECIATION_RUN_BULK: "depreciation:run_bulk",

    // ─── BRANCH ──────────────────────────────────────────────────────────────
    BRANCH_CREATE: "branch:create",
    BRANCH_READ: "branch:read",
    BRANCH_UPDATE: "branch:update",
    BRANCH_DELETE: "branch:delete",
    BRANCH_FORCE_DELETE: "branch:force_delete",

    // ─── MAINTENANCE ─────────────────────────────────────────────────────────
    MAINTENANCE_CREATE: "maintenance:create",
    MAINTENANCE_READ: "maintenance:read",
    MAINTENANCE_UPDATE: "maintenance:update",
    MAINTENANCE_COMPLETE: "maintenance:complete",

    // ─── NOTIFICATION ────────────────────────────────────────────────────────
    NOTIFICATION_READ: "notification:read",
    NOTIFICATION_MANAGE: "notification:manage",
    NOTIFICATION_ANNOUNCE: "notification:announce",

    // ─── ORGANIZATION ────────────────────────────────────────────────────────
    ORG_SETTINGS_READ: "org:settings:read",
    ORG_SETTINGS_UPDATE: "org:settings:update",
    ORG_OWNERSHIP_TRANSFER: "org:ownership:transfer",
    ORG_DELETE: "org:delete",

    // ─── USER & TEAM MANAGEMENT ──────────────────────────────────────────────
    USER_INVITE: "user:invite",
    USER_READ: "user:read",
    USER_UPDATE: "user:update",
    USER_SUSPEND: "user:suspend",
    USER_REMOVE: "user:remove",

    // ─── ROLE MANAGEMENT ─────────────────────────────────────────────────────
    ROLE_ASSIGN: "role:assign",
    ROLE_READ: "role:read",

    // ─── AUDIT & COMPLIANCE ──────────────────────────────────────────────────
    AUDIT_CAMPAIGN_CREATE: "audit:campaign:create",
    AUDIT_CAMPAIGN_READ: "audit:campaign:read",
    AUDIT_CAMPAIGN_UPDATE: "audit:campaign:update",
    AUDIT_CAMPAIGN_DELETE: "audit:campaign:delete",
    AUDIT_VERIFICATION_UPDATE: "audit:verification:update",

    // ─── REPORTING & DASHBOARDS ──────────────────────────────────────────────
    REPORT_VIEW: "report:view",

    // ─── DOCUMENT & EVIDENCE ATTACHMENTS ─────────────────────────────────────
    DOCUMENT_UPLOAD: "document:upload",
    DOCUMENT_DELETE: "document:delete",

    // ─── INSURANCE ───────────────────────────────────────────────────────────
    INSURANCE_READ: "insurance:read",
    INSURANCE_WRITE: "insurance:write",
    INSURANCE_DELETE: "insurance:delete",

    // ─── REVALUATION ─────────────────────────────────────────────────────────
    REVALUATION_READ: "revaluation:read",
    REVALUATION_WRITE: "revaluation:write",
    REVALUATION_DELETE: "revaluation:delete",

} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — SYSTEM ROLE NAMES
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — ROLE PERMISSION ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<SystemRoleName, PermissionKey[]> = {

    // ─── ADMIN ───────────────────────────────────────────────────────────────
    [SYSTEM_ROLES.ADMIN]: [
        PERMISSIONS.ASSET_CREATE,
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_UPDATE,
        PERMISSIONS.ASSET_DELETE,
        PERMISSIONS.ASSET_RESTORE,
        PERMISSIONS.ASSET_TRANSFER,
        PERMISSIONS.ASSET_DISPOSE,
        PERMISSIONS.ASSET_DISPOSE_APPROVE,
        PERMISSIONS.ASSET_IMPORT,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.ASSET_AUDIT,
        PERMISSIONS.DEPRECIATION_RECORD,
        PERMISSIONS.DEPRECIATION_EDIT,
        PERMISSIONS.DEPRECIATION_DELETE,
        PERMISSIONS.DEPRECIATION_RUN_BULK,
        PERMISSIONS.BRANCH_CREATE,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.BRANCH_UPDATE,
        PERMISSIONS.BRANCH_DELETE,
        PERMISSIONS.BRANCH_FORCE_DELETE,
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_COMPLETE,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.NOTIFICATION_MANAGE,
        PERMISSIONS.NOTIFICATION_ANNOUNCE,
        PERMISSIONS.ORG_SETTINGS_READ,
        PERMISSIONS.ORG_SETTINGS_UPDATE,
        PERMISSIONS.ORG_OWNERSHIP_TRANSFER,
        PERMISSIONS.ORG_DELETE,
        PERMISSIONS.USER_INVITE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_UPDATE,
        PERMISSIONS.USER_SUSPEND,
        PERMISSIONS.USER_REMOVE,
        PERMISSIONS.ROLE_ASSIGN,
        PERMISSIONS.ROLE_READ,
        PERMISSIONS.AUDIT_CAMPAIGN_CREATE,
        PERMISSIONS.AUDIT_CAMPAIGN_READ,
        PERMISSIONS.AUDIT_CAMPAIGN_UPDATE,
        PERMISSIONS.AUDIT_CAMPAIGN_DELETE,
        PERMISSIONS.AUDIT_VERIFICATION_UPDATE,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.DOCUMENT_UPLOAD,
        PERMISSIONS.DOCUMENT_DELETE,
        PERMISSIONS.INSURANCE_READ,
        PERMISSIONS.INSURANCE_WRITE,
        PERMISSIONS.INSURANCE_DELETE,
        PERMISSIONS.REVALUATION_READ,
        PERMISSIONS.REVALUATION_WRITE,
        PERMISSIONS.REVALUATION_DELETE,
    ],

    // ─── ASSET MANAGER ───────────────────────────────────────────────────────
    // Full asset lifecycle. Cannot approve disposals above threshold.
    // Cannot touch org settings, billing, or user management.
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
        PERMISSIONS.DEPRECIATION_RECORD,
        PERMISSIONS.BRANCH_CREATE,        // ← can create branches
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_COMPLETE,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.USER_READ,
        PERMISSIONS.AUDIT_CAMPAIGN_CREATE,
        PERMISSIONS.AUDIT_CAMPAIGN_READ,
        PERMISSIONS.AUDIT_CAMPAIGN_UPDATE,
        PERMISSIONS.AUDIT_VERIFICATION_UPDATE,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.DOCUMENT_UPLOAD,
        PERMISSIONS.DOCUMENT_DELETE,
        PERMISSIONS.INSURANCE_READ,
        PERMISSIONS.INSURANCE_WRITE,
        PERMISSIONS.REVALUATION_READ,
    ],

    // ─── FINANCE ─────────────────────────────────────────────────────────────
    // Full financial visibility. Approves disposals above threshold.
    // Cannot create assets, transfer, import, or manage users.
    [SYSTEM_ROLES.FINANCE]: [
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.ASSET_AUDIT,
        PERMISSIONS.ASSET_DISPOSE_APPROVE,
        PERMISSIONS.DEPRECIATION_RECORD,
        PERMISSIONS.DEPRECIATION_EDIT,
        PERMISSIONS.DEPRECIATION_RUN_BULK,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.ORG_SETTINGS_READ,
        PERMISSIONS.ORG_SETTINGS_UPDATE,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.DOCUMENT_UPLOAD,
        PERMISSIONS.INSURANCE_READ,
        PERMISSIONS.INSURANCE_WRITE,
        PERMISSIONS.INSURANCE_DELETE,
        PERMISSIONS.REVALUATION_READ,
        PERMISSIONS.REVALUATION_WRITE,
        PERMISSIONS.REVALUATION_DELETE,
    ],

    // ─── AUDITOR ─────────────────────────────────────────────────────────────
    // Read-only access to everything. Zero write access to asset data.
    [SYSTEM_ROLES.AUDITOR]: [
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.ASSET_AUDIT,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.ORG_SETTINGS_READ,
        PERMISSIONS.ROLE_READ,
        PERMISSIONS.AUDIT_CAMPAIGN_CREATE,
        PERMISSIONS.AUDIT_CAMPAIGN_READ,
        PERMISSIONS.AUDIT_CAMPAIGN_UPDATE,
        PERMISSIONS.AUDIT_VERIFICATION_UPDATE,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.INSURANCE_READ,
        PERMISSIONS.REVALUATION_READ,
    ],

    // ─── BRANCH MANAGER ──────────────────────────────────────────────────────
    // All asset operations scoped to own branch only.
    // Scope enforcement via requireBranchScope middleware.
    [SYSTEM_ROLES.BRANCH_MANAGER]: [
        PERMISSIONS.ASSET_CREATE,
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.ASSET_UPDATE,
        PERMISSIONS.ASSET_TRANSFER,
        PERMISSIONS.ASSET_EXPORT,
        PERMISSIONS.ASSET_AUDIT,
        PERMISSIONS.BRANCH_READ,
        PERMISSIONS.BRANCH_UPDATE,
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_COMPLETE,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.USER_READ,
        PERMISSIONS.AUDIT_CAMPAIGN_READ,
        PERMISSIONS.AUDIT_VERIFICATION_UPDATE,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.DOCUMENT_UPLOAD,
        PERMISSIONS.INSURANCE_READ,
        PERMISSIONS.REVALUATION_READ,
    ],

    // ─── MAINTENANCE STAFF ───────────────────────────────────────────────────
    // Views and completes assigned tasks only.
    // Own-task-only scope enforced at service layer.
    [SYSTEM_ROLES.MAINTENANCE_STAFF]: [
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.BRANCH_READ,          // ← can view branch context
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_COMPLETE,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.DOCUMENT_UPLOAD,
    ],

    // ─── STANDARD STAFF ──────────────────────────────────────────────────────
    // My Assets only. No branch listing. No maintenance listing.
    // No financial data access.
    [SYSTEM_ROLES.STANDARD_STAFF]: [
        PERMISSIONS.ASSET_READ,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.AUDIT_CAMPAIGN_READ,
        PERMISSIONS.AUDIT_VERIFICATION_UPDATE,
    ],

};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — ROLE HIERARCHY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const ADMIN_ROLES = new Set<SystemRoleName>([
    SYSTEM_ROLES.ADMIN,
]);

export const FINANCE_VISIBLE_ROLES = new Set<SystemRoleName>([
    SYSTEM_ROLES.ADMIN,
    SYSTEM_ROLES.ASSET_MANAGER,
    SYSTEM_ROLES.FINANCE,
    SYSTEM_ROLES.AUDITOR,
]);

export const BRANCH_SCOPED_ROLES = new Set<SystemRoleName>([
    SYSTEM_ROLES.BRANCH_MANAGER,
]);

export const ASSIGNMENT_SCOPED_ROLES = new Set<SystemRoleName>([
    SYSTEM_ROLES.MAINTENANCE_STAFF,
    SYSTEM_ROLES.STANDARD_STAFF,
]);

export const READ_ONLY_ROLES = new Set<SystemRoleName>([
    SYSTEM_ROLES.AUDITOR,
]);