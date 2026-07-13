import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../../../db";
import {
    users,
    organizations,
    plans,
    organizationUsers,
    roles,
    permissions,
    rolePermissions,
    userRoles,
    branches,
    assets,
    maintenanceTasks,
} from "../../../model";
import {
    PERMISSIONS,
    ROLE_PERMISSIONS,
    SYSTEM_ROLES,
    SystemRoleName,
    PermissionKey,
} from "../../../config/permissions";
import { TEST_IDS } from "./test-auth";
import bcrypt from "bcrypt";

const PASSWORD_HASH = bcrypt.hashSync("TestPassword123!", 10);
const PLAN_ID = "00000000-0000-0000-0000-000000000099";

// ─────────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────────

export async function seedTestData(): Promise<void> {

    // ── 1. Plan ───────────────────────────────────────────────────────────────
    await db.insert(plans).values({
        id: PLAN_ID,
        name: "Test Plan",
        code: `test_plan_${Date.now()}`,
        maxStaff: 100,
        isActive: true,
    }).onConflictDoNothing();

    // ── 2. Users ──────────────────────────────────────────────────────────────
    const testUsers = [
        { id: TEST_IDS.adminUserId, email: "admin@test.com", firstName: "Admin", lastName: "User" },
        { id: TEST_IDS.assetManagerUserId, email: "assetmanager@test.com", firstName: "Asset", lastName: "Manager" },
        { id: TEST_IDS.financeUserId, email: "finance@test.com", firstName: "Finance", lastName: "User" },
        { id: TEST_IDS.auditorUserId, email: "auditor@test.com", firstName: "Auditor", lastName: "User" },
        { id: TEST_IDS.branchManagerUserId, email: "branchmanager@test.com", firstName: "Branch", lastName: "Manager" },
        { id: TEST_IDS.maintenanceUserId, email: "maintenance@test.com", firstName: "Maintenance", lastName: "Staff" },
        { id: TEST_IDS.standardUserId, email: "staff@test.com", firstName: "Standard", lastName: "Staff" },
    ];

    for (const u of testUsers) {
        await db.insert(users).values({
            ...u,
            passwordHash: PASSWORD_HASH,
            isActive: true,
        }).onConflictDoNothing();
    }

    // ── 3. Organization ───────────────────────────────────────────────────────
    await db.insert(organizations).values({
        id: TEST_IDS.organizationId,
        name: "Test Organization",
        slug: `test-org-${Date.now()}`,
        planId: PLAN_ID,
        ownerUserId: TEST_IDS.adminUserId,
        multiBranchEnabled: false,
        isActive: true,
    }).onConflictDoNothing();

    // ── 4. Memberships ────────────────────────────────────────────────────────
    for (const u of testUsers) {
        await db.insert(organizationUsers).values({
            organizationId: TEST_IDS.organizationId,
            userId: u.id,
            status: "active",
            joinedAt: new Date(),
        }).onConflictDoNothing();
    }

    // ── 5. Branches ───────────────────────────────────────────────────────────
    await db.insert(branches).values([
        {
            id: TEST_IDS.branchId,
            organizationId: TEST_IDS.organizationId,
            name: "Main Branch",
            code: "MAIN",
        },
        {
            id: TEST_IDS.otherBranchId,
            organizationId: TEST_IDS.organizationId,
            name: "Other Branch",
            code: "OTHER",
        },
    ]).onConflictDoNothing();

    // ── 6. Permissions ────────────────────────────────────────────────────────
    // Always insert all permission keys fresh
    // cleanTestData deletes all permissions so this is always a full insert
    const allKeys = Object.values(PERMISSIONS) as PermissionKey[];

    await db.insert(permissions).values(
        allKeys.map((key) => ({ key, description: key }))
    ).onConflictDoNothing();

    const permRows = await db
        .select({ id: permissions.id, key: permissions.key })
        .from(permissions);

    const permMap = new Map(permRows.map((r) => [r.key as PermissionKey, r.id]));

    // ── 7. Roles + role_permissions ───────────────────────────────────────────
    const roleNameToId = new Map<SystemRoleName, string>();

    for (const roleName of Object.values(SYSTEM_ROLES) as SystemRoleName[]) {

        await db.insert(roles).values({
            organizationId: TEST_IDS.organizationId,
            name: roleName,
            description: roleName,
            isSystem: true,
        }).onConflictDoNothing();

        const found = await db
            .select({ id: roles.id })
            .from(roles)
            .where(
                and(
                    eq(roles.organizationId, TEST_IDS.organizationId),
                    eq(roles.name, roleName),
                    isNull(roles.deletedAt)
                )
            );

        const roleId = found[0]?.id;
        if (!roleId) continue;

        roleNameToId.set(roleName, roleId);

        const permKeys = ROLE_PERMISSIONS[roleName];
        const rpValues = permKeys
            .map((key) => {
                const permId = permMap.get(key);
                if (!permId) return null;
                return { roleId, permissionId: permId };
            })
            .filter((v): v is { roleId: string; permissionId: string } => v !== null);

        if (rpValues.length > 0) {
            await db.insert(rolePermissions)
                .values(rpValues)
                .onConflictDoNothing();
        }
    }

    // ── 8. User → Role assignments ────────────────────────────────────────────
    const assignments: Array<{ userId: string; roleName: SystemRoleName }> = [
        { userId: TEST_IDS.adminUserId, roleName: SYSTEM_ROLES.ADMIN },
        { userId: TEST_IDS.assetManagerUserId, roleName: SYSTEM_ROLES.ASSET_MANAGER },
        { userId: TEST_IDS.financeUserId, roleName: SYSTEM_ROLES.FINANCE },
        { userId: TEST_IDS.auditorUserId, roleName: SYSTEM_ROLES.AUDITOR },
        { userId: TEST_IDS.branchManagerUserId, roleName: SYSTEM_ROLES.BRANCH_MANAGER },
        { userId: TEST_IDS.maintenanceUserId, roleName: SYSTEM_ROLES.MAINTENANCE_STAFF },
        { userId: TEST_IDS.standardUserId, roleName: SYSTEM_ROLES.STANDARD_STAFF },
    ];

    for (const { userId, roleName } of assignments) {
        const roleId = roleNameToId.get(roleName);
        if (!roleId) continue;

        await db.insert(userRoles).values({
            organizationId: TEST_IDS.organizationId,
            userId,
            roleId,
            assignedByUserId: TEST_IDS.adminUserId,
        }).onConflictDoNothing();
    }

    // ── 9. Assets ─────────────────────────────────────────────────────────────
    await db.insert(assets).values([
        {
            id: TEST_IDS.assetId,
            organizationId: TEST_IDS.organizationId,
            name: "Test Asset Main Branch",
            assetTag: "E2E-TST-001",
            branchId: TEST_IDS.branchId,
            assignedTo: TEST_IDS.maintenanceUserId,
            status: "active" as const,
            condition: "good" as const,
            purchaseCost: "50000.00",
            hasFutureEconomicBenefit: true,
            costCanBeReliablyMeasured: true,
        },
        {
            id: TEST_IDS.otherBranchAssetId,
            organizationId: TEST_IDS.organizationId,
            name: "Test Asset Other Branch",
            assetTag: "E2E-TST-002",
            branchId: TEST_IDS.otherBranchId,
            status: "active" as const,
            condition: "good" as const,
            purchaseCost: "75000.00",
            hasFutureEconomicBenefit: true,
            costCanBeReliablyMeasured: true,
        },
    ]).onConflictDoNothing();

    // ── 10. Maintenance task ──────────────────────────────────────────────────
    await db.insert(maintenanceTasks).values({
        id: TEST_IDS.maintenanceTaskId,
        organizationId: TEST_IDS.organizationId,
        assetId: TEST_IDS.assetId,
        title: "E2E Test Maintenance Task",
        status: "open" as const,
        priority: "medium" as const,
        assignedTo: TEST_IDS.maintenanceUserId,
    }).onConflictDoNothing();
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEAN
// ─────────────────────────────────────────────────────────────────────────────

export async function cleanTestData(): Promise<void> {

    // ── 1. Maintenance tasks ──────────────────────────────────────────────────
    await db.delete(maintenanceTasks)
        .where(eq(maintenanceTasks.organizationId, TEST_IDS.organizationId));

    // ── 2. Assets ─────────────────────────────────────────────────────────────
    await db.delete(assets)
        .where(eq(assets.organizationId, TEST_IDS.organizationId));

    // ── 3. User-role assignments ──────────────────────────────────────────────
    await db.delete(userRoles)
        .where(eq(userRoles.organizationId, TEST_IDS.organizationId));

    // ── 4. Role-permission assignments ────────────────────────────────────────
    const orgRoles = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.organizationId, TEST_IDS.organizationId));

    if (orgRoles.length > 0) {
        const roleIds = orgRoles.map((r) => r.id);
        await db.delete(rolePermissions)
            .where(inArray(rolePermissions.roleId, roleIds));
    }

    // ── 5. Roles ──────────────────────────────────────────────────────────────
    await db.delete(roles)
        .where(eq(roles.organizationId, TEST_IDS.organizationId));

    // ── 6. ALL permissions ────────────────────────────────────────────────────
    // Delete the global permissions table so the next seedTestData call
    // inserts the current PERMISSIONS config fresh — including any new keys
    // added since the last run. Without this, onConflictDoNothing silently
    // skips new permission keys and role assignments stay stale.
    await db.delete(permissions);

    // ── 7. Memberships ────────────────────────────────────────────────────────
    await db.delete(organizationUsers)
        .where(eq(organizationUsers.organizationId, TEST_IDS.organizationId));

    // ── 8. Branches ───────────────────────────────────────────────────────────
    await db.delete(branches)
        .where(eq(branches.organizationId, TEST_IDS.organizationId));

    // ── 9. Organization ───────────────────────────────────────────────────────
    await db.delete(organizations)
        .where(eq(organizations.id, TEST_IDS.organizationId));

    // ── 10. Users ─────────────────────────────────────────────────────────────
    const testUserIds = [
        TEST_IDS.adminUserId,
        TEST_IDS.assetManagerUserId,
        TEST_IDS.financeUserId,
        TEST_IDS.auditorUserId,
        TEST_IDS.branchManagerUserId,
        TEST_IDS.maintenanceUserId,
        TEST_IDS.standardUserId,
    ];

    await db.delete(users)
        .where(inArray(users.id, testUserIds));

    // ── 11. Plan ──────────────────────────────────────────────────────────────
    await db.delete(plans)
        .where(eq(plans.id, PLAN_ID));
}