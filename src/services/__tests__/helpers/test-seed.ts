// ─────────────────────────────────────────────────────────────────────────────
// TEST DATA SEEDER
// Seeds the minimum data required for E2E permission tests:
//   - 1 organization
//   - 1 plan
//   - 8 users (one per role)
//   - 2 branches
//   - All system roles and permissions
//   - User-role assignments
//   - 2 assets (one per branch)
//   - 1 maintenance task
//
// Uses raw SQL via pool for speed and control
// All IDs match TEST_IDS constants in test-auth.ts
// ─────────────────────────────────────────────────────────────────────────────

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
} from "../../../model";
import { assets } from "../../../model";
import { branches } from "../../../model";
import { maintenanceTasks } from "../../../model";
import { PERMISSIONS, ROLE_PERMISSIONS, SYSTEM_ROLES, SystemRoleName, PermissionKey } from "../../../config/permissions";
import { TEST_IDS } from "./test-auth";
import bcrypt from "bcrypt";

const PASSWORD_HASH = bcrypt.hashSync("TestPassword123!", 10);

export async function seedTestData(): Promise<void> {
    // ── Plan ──────────────────────────────────────────────────────────────────
    await db.insert(plans).values({
        id: "00000000-0000-0000-0000-000000000099",
        name: "Test Plan",
        code: "test_plan",
        maxStaff: 100,
    }).onConflictDoNothing();

    // ── Organization ──────────────────────────────────────────────────────────
    await db.insert(organizations).values({
        id: TEST_IDS.organizationId,
        name: "Test Organization",
        slug: "test-org",
        planId: "00000000-0000-0000-0000-000000000099",
        ownerUserId: TEST_IDS.adminUserId,
        multiBranchEnabled: false,
        isActive: true,
    }).onConflictDoNothing();

    // ── Users ─────────────────────────────────────────────────────────────────
    const usersToSeed = [
        { id: TEST_IDS.adminUserId, email: "admin@test.com", firstName: "Admin", lastName: "User" },
        { id: TEST_IDS.assetManagerUserId, email: "assetmanager@test.com", firstName: "Asset", lastName: "Manager" },
        { id: TEST_IDS.financeUserId, email: "finance@test.com", firstName: "Finance", lastName: "User" },
        { id: TEST_IDS.auditorUserId, email: "auditor@test.com", firstName: "Auditor", lastName: "User" },
        { id: TEST_IDS.branchManagerUserId, email: "branchmanager@test.com", firstName: "Branch", lastName: "Manager" },
        { id: TEST_IDS.maintenanceUserId, email: "maintenance@test.com", firstName: "Maintenance", lastName: "Staff" },
        { id: TEST_IDS.standardUserId, email: "staff@test.com", firstName: "Standard", lastName: "Staff" },
    ];

    for (const user of usersToSeed) {
        await db.insert(users).values({
            ...user,
            passwordHash: PASSWORD_HASH,
            isActive: true,
        }).onConflictDoNothing();
    }

    // ── Organization memberships ───────────────────────────────────────────────
    for (const user of usersToSeed) {
        await db.insert(organizationUsers).values({
            organizationId: TEST_IDS.organizationId,
            userId: user.id,
            status: "active",
            joinedAt: new Date(),
        }).onConflictDoNothing();
    }

    // ── Branches ──────────────────────────────────────────────────────────────
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

    // ── Permissions ───────────────────────────────────────────────────────────
    const allPermissionKeys = Object.values(PERMISSIONS) as PermissionKey[];
    const permissionValues = allPermissionKeys.map((key) => ({
        key,
        description: key,
    }));

    await db.insert(permissions)
        .values(permissionValues)
        .onConflictDoNothing();

    const permissionRows = await db
        .select({ id: permissions.id, key: permissions.key })
        .from(permissions);

    const permMap = new Map(permissionRows.map((r) => [r.key, r.id]));

    // ── Roles and role-permission assignments ─────────────────────────────────
    const roleNameToId = new Map<string, string>();

    const roleEntries = Object.values(SYSTEM_ROLES) as SystemRoleName[];

    for (const roleName of roleEntries) {
        const inserted = await db.insert(roles).values({
            organizationId: TEST_IDS.organizationId,
            name: roleName,
            description: roleName,
            isSystem: true,
        })
            .onConflictDoNothing()
            .returning({ id: roles.id });

        // If already existed, fetch it
        let roleId = inserted[0]?.id;
        if (!roleId) {
            const existing = await db
                .select({ id: roles.id })
                .from(roles)
                .where(
                    db.$with("r").as(
                        db.select().from(roles)
                    ) as any
                );
            // Simpler fetch
            const { eq, and, isNull } = await import("drizzle-orm");
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
            roleId = found[0]?.id;
        }

        if (!roleId) continue;
        roleNameToId.set(roleName, roleId);

        // Assign permissions to role
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

    // ── User-role assignments ─────────────────────────────────────────────────
    const userRoleMap: Array<{ userId: string; roleName: SystemRoleName }> = [
        { userId: TEST_IDS.adminUserId, roleName: SYSTEM_ROLES.ADMIN },
        { userId: TEST_IDS.assetManagerUserId, roleName: SYSTEM_ROLES.ASSET_MANAGER },
        { userId: TEST_IDS.financeUserId, roleName: SYSTEM_ROLES.FINANCE },
        { userId: TEST_IDS.auditorUserId, roleName: SYSTEM_ROLES.AUDITOR },
        { userId: TEST_IDS.branchManagerUserId, roleName: SYSTEM_ROLES.BRANCH_MANAGER },
        { userId: TEST_IDS.maintenanceUserId, roleName: SYSTEM_ROLES.MAINTENANCE_STAFF },
        { userId: TEST_IDS.standardUserId, roleName: SYSTEM_ROLES.STANDARD_STAFF },
    ];

    for (const { userId, roleName } of userRoleMap) {
        const roleId = roleNameToId.get(roleName);
        if (!roleId) continue;

        await db.insert(userRoles).values({
            organizationId: TEST_IDS.organizationId,
            userId,
            roleId,
            assignedByUserId: TEST_IDS.adminUserId,
        }).onConflictDoNothing();
    }

    // ── Assets ────────────────────────────────────────────────────────────────
    await db.insert(assets).values([
        {
            id: TEST_IDS.assetId,
            organizationId: TEST_IDS.organizationId,
            name: "Test Asset Main Branch",
            assetTag: "TST-001",
            branchId: TEST_IDS.branchId,
            assignedUserId: TEST_IDS.maintenanceUserId,
            status: "active",
            condition: "good",
            purchaseCost: "50000.00",
        },
        {
            id: TEST_IDS.otherBranchAssetId,
            organizationId: TEST_IDS.organizationId,
            name: "Test Asset Other Branch",
            assetTag: "TST-002",
            branchId: TEST_IDS.otherBranchId,
            status: "active",
            condition: "good",
            purchaseCost: "75000.00",
        },
    ]).onConflictDoNothing();

    // ── Maintenance task ──────────────────────────────────────────────────────
    await db.insert(maintenanceTasks).values({
        id: TEST_IDS.maintenanceTaskId,
        organizationId: TEST_IDS.organizationId,
        assetId: TEST_IDS.assetId,
        title: "Test Maintenance Task",
        status: "open",
        priority: "medium",
        assignedUserId: TEST_IDS.maintenanceUserId,
    }).onConflictDoNothing();
}

export async function cleanTestData(): Promise<void> {
    const { eq } = await import("drizzle-orm");

    // Order matters — delete children before parents
    await db.delete(maintenanceTasks)
        .where(eq(maintenanceTasks.organizationId, TEST_IDS.organizationId));
    await db.delete(assets)
        .where(eq(assets.organizationId, TEST_IDS.organizationId));
    await db.delete(userRoles)
        .where(eq(userRoles.organizationId, TEST_IDS.organizationId));
    await db.delete(rolePermissions);
    await db.delete(roles)
        .where(eq(roles.organizationId, TEST_IDS.organizationId));
    await db.delete(permissions);
    await db.delete(organizationUsers)
        .where(eq(organizationUsers.organizationId, TEST_IDS.organizationId));
    await db.delete(organizations)
        .where(eq(organizations.id, TEST_IDS.organizationId));
    await db.delete(users)
        .where(eq(users.id, TEST_IDS.adminUserId));
}