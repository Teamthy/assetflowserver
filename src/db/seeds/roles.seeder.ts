import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../index";
import {
    permissions,
    rolePermissions,
    roles,
    organizations,
} from "../../model";
import {
    PERMISSIONS,
    ROLE_PERMISSIONS,
    SYSTEM_ROLES,
    PermissionKey,
    SystemRoleName,
} from "../../config/permissions";
import { logger } from "../../utils/logger";

/**
 * Seed all permissions into the permissions table.
 * Idempotent — skips existing permissions.
 */
async function seedPermissions(): Promise<Map<PermissionKey, string>> {
    const allPermissionKeys = Object.values(PERMISSIONS) as PermissionKey[];

    const values = allPermissionKeys.map((key) => ({
        key,
        description: buildPermissionDescription(key),
    }));

    await db
        .insert(permissions)
        .values(values)
        .onConflictDoNothing();

    const rows = await db
        .select({ id: permissions.id, key: permissions.key })
        .from(permissions)
        .where(inArray(permissions.key, allPermissionKeys));

    const permissionMap = new Map<PermissionKey, string>();
    for (const row of rows) {
        permissionMap.set(row.key as PermissionKey, row.id);
    }

    logger.info(`[Seeder] Permissions seeded: ${permissionMap.size}`);
    return permissionMap;
}

/**
 * Seed system roles for a single organization.
 * Idempotent — skips existing roles.
 */
async function seedRolesForOrganization(
    organizationId: string,
    permissionMap: Map<PermissionKey, string>
): Promise<void> {
    const roleNames = Object.values(SYSTEM_ROLES) as SystemRoleName[];

    for (const roleName of roleNames) {
        const existing = await db
            .select({ id: roles.id })
            .from(roles)
            .where(
                and(
                    eq(roles.organizationId, organizationId),
                    eq(roles.name, roleName),
                    isNull(roles.deletedAt)
                )
            );

        let roleId: string;

        if (existing.length > 0) {
            roleId = existing[0].id;
            logger.info(`[Seeder] Role already exists: ${roleName} (org: ${organizationId})`);
        } else {
            const inserted = await db
                .insert(roles)
                .values({
                    organizationId,
                    name: roleName,
                    description: buildRoleDescription(roleName),
                    isSystem: true,
                })
                .returning({ id: roles.id });

            roleId = inserted[0].id;
            logger.info(`[Seeder] Role created: ${roleName} (org: ${organizationId})`);
        }

        const rolePermissionKeys = ROLE_PERMISSIONS[roleName];
        await seedRolePermissions(roleId, rolePermissionKeys, permissionMap);
    }
}

/**
 * Seed role_permissions for a given role.
 * Idempotent — skips existing assignments.
 */
async function seedRolePermissions(
    roleId: string,
    permissionKeys: PermissionKey[],
    permissionMap: Map<PermissionKey, string>
): Promise<void> {
    const values = permissionKeys
        .map((key) => {
            const permissionId = permissionMap.get(key);
            if (!permissionId) {
                logger.warn(`[Seeder] Permission key not found in map: ${key}`);
                return null;
            }
            return { roleId, permissionId };
        })
        .filter((v): v is { roleId: string; permissionId: string } => v !== null);

    if (values.length === 0) return;

    await db
        .insert(rolePermissions)
        .values(values)
        .onConflictDoNothing();
}

/**
 * Seed all organizations.
 * Run this once on startup or as a one-time migration script.
 */
export async function seedAllOrganizations(): Promise<void> {
    logger.info("[Seeder] Starting role seeding for all organizations...");

    const permissionMap = await seedPermissions();

    const allOrgs = await db
        .select({ id: organizations.id, name: organizations.name })
        .from(organizations)
        .where(
            and(
                eq(organizations.isActive, true),
                isNull(organizations.deletedAt)
            )
        );

    logger.info(`[Seeder] Found ${allOrgs.length} organizations to seed`);

    for (const org of allOrgs) {
        logger.info(`[Seeder] Seeding roles for org: ${org.name} (${org.id})`);
        await seedRolesForOrganization(org.id, permissionMap);
    }

    logger.info("[Seeder] Role seeding complete");
}

/**
 * Seed roles for a single organization.
 * Call this when a new organization is created.
 */
export async function seedRolesForNewOrganization(
    organizationId: string
): Promise<void> {
    logger.info(`[Seeder] Seeding roles for new org: ${organizationId}`);

    const permissionMap = await seedPermissions();
    await seedRolesForOrganization(organizationId, permissionMap);

    logger.info(`[Seeder] Role seeding complete for org: ${organizationId}`);
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function buildPermissionDescription(key: PermissionKey): string {
    const descriptions: Record<PermissionKey, string> = {
        "asset:create": "Create new assets",
        "asset:read": "View assets",
        "asset:update": "Update existing assets",
        "asset:delete": "Delete assets",
        "asset:restore": "Restore deleted or disposed assets",
        "asset:transfer": "Transfer assets between branches or users",
        "asset:dispose": "Dispose of assets",
        "asset:import": "Import assets from spreadsheet",
        "asset:export": "Export assets to spreadsheet",
        "asset:audit": "View asset audit summaries",
        "depreciation:record": "Record depreciation snapshots",
        "branch:create": "Create branches",
        "branch:read": "View branches",
        "branch:update": "Update branches",
        "branch:delete": "Delete branches",
        "maintenance:create": "Create maintenance tasks",
        "maintenance:read": "View maintenance tasks",
        "maintenance:update": "Update maintenance tasks",
        "maintenance:complete": "Complete maintenance tasks",
        "notification:read": "View notifications",
        "notification:manage": "Manage all notifications",
        "org:settings:read": "View organization settings",
        "org:settings:update": "Update organization settings",
        "user:invite": "Invite users to the organization",
        "user:read": "View organization users",
        "user:update": "Update user profiles",
        "user:suspend": "Suspend or reactivate users",
        "role:assign": "Assign roles to users",
        "role:read": "View roles and permissions",
    };

    return descriptions[key] ?? key;
}

function buildRoleDescription(roleName: SystemRoleName): string {
    const descriptions: Record<SystemRoleName, string> = {
        admin: "Full access to all organization resources and settings",
        asset_manager: "Manages the full asset register and lifecycle operations",
        finance: "Reviews capitalization, records depreciation, and manages disposals",
        auditor: "Read-only access for audit and compliance reviews",
        branch_manager: "Manages assets and maintenance within their branch",
        maintenance_staff: "Creates and completes maintenance tasks",
        standard_staff: "Read-only access to assets and branches",
    };

    return descriptions[roleName] ?? roleName;
}