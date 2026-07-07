import {
    assignPermissionsToRole,
    createSystemRole,
    findPermissionIdsByKeys,
    findUserPermissionKeys,
    findUserRoles,
} from "../repositories/roles";
import {
    DEFAULT_ROLE_PERMISSIONS,
    PERMISSIONS,
    SYSTEM_ROLES,
    type PermissionKey,
    type SystemRole,
} from "../types/roles";


type CacheEntry = { keys: Set<string>; expiresAt: number };
const permissionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

const cacheKey = (userId: string, organizationId: string) =>
    `${userId}:${organizationId}`;


export const getUserPermissions = async (
    userId: string,
    organizationId: string,
): Promise<Set<string>> => {
    const key = cacheKey(userId, organizationId);
    const cached = permissionCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.keys;
    }

    const keys = await findUserPermissionKeys(userId, organizationId);
    const set = new Set(keys);
    permissionCache.set(key, { keys: set, expiresAt: Date.now() + CACHE_TTL_MS });
    return set;
};


export const invalidateUserPermissions = (
    userId: string,
    organizationId: string,
) => {
    permissionCache.delete(cacheKey(userId, organizationId));
};


export const invalidateAllPermissions = () => {
    permissionCache.clear();
};


export const userHasPermission = async (
    userId: string,
    organizationId: string,
    permission: PermissionKey,
): Promise<boolean> => {
    const perms = await getUserPermissions(userId, organizationId);
    return perms.has(permission);
};


export const listUserRoles = async (
    userId: string,
    organizationId: string,
) => {
    return findUserRoles(userId, organizationId);
};


export const seedSystemRolesForOrganization = async (params: {
    organizationId: string;
    ownerUserId: string;
}) => {
    const roleDescriptions: Record<SystemRole, string> = {
        [SYSTEM_ROLES.SUPER_ADMIN]:
            "Full control of the organization. Can manage settings, users, roles, and all data.",
        [SYSTEM_ROLES.ADMIN]:
            "Operational manager. Creates assets, transfers, imports, and manages branches. Cannot delete data or change org settings.",
        [SYSTEM_ROLES.FINANCE]:
            "Handles accounting workflows: recognition review, depreciation, disposals, and audit exports.",
        [SYSTEM_ROLES.MAINTENANCE]:
            "Runs maintenance operations. Creates assets found on-site, updates asset condition, and manages maintenance tasks.",
        [SYSTEM_ROLES.ANALYST]:
            "Data-focused role. Creates and imports assets, monitors maintenance, and exports reports.",
        [SYSTEM_ROLES.STAFF]:
            "Standard employee. Reads assigned assets and completes maintenance tasks assigned to them.",
    };

    const results: Record<string, string> = {};

    for (const [roleName, permissionKeys] of Object.entries(
        DEFAULT_ROLE_PERMISSIONS,
    ) as [SystemRole, PermissionKey[]][]) {
        const role = await createSystemRole({
            organizationId: params.organizationId,
            name: roleName,
            description: roleDescriptions[roleName],
            createdByUserId: params.ownerUserId,
        });
        results[roleName] = role.id;

        const permissionRows = await findPermissionIdsByKeys(permissionKeys);
        await assignPermissionsToRole(
            role.id,
            permissionRows.map((row) => row.id),
        );
    }

    return results;
};

export const getUserPermissionList = async (
    userId: string,
    organizationId: string,
): Promise<string[]> => {
    const set = await getUserPermissions(userId, organizationId);
    return Array.from(set).sort();
};