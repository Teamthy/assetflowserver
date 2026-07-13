
import request from "supertest";
import { createTestApp } from "./helpers/test-app";
import { seedTestData, cleanTestData } from "./helpers/test-seed";
import {
    adminToken,
    assetManagerToken,
    financeToken,
    auditorToken,
    branchManagerToken,
    maintenanceStaffToken,
    standardStaffToken,
    TEST_IDS,
} from "./helpers/test-auth";

// ─── App instance shared across all tests ────────────────────────────────────
const app = createTestApp();

// ─── Test lifecycle ───────────────────────────────────────────────────────────
beforeAll(async () => {
    await cleanTestData();
    await seedTestData();
}, 30000); // ← 30 second timeout

afterAll(async () => {
    await cleanTestData();
}, 30000); // ← 30 second timeout
// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — AUTHENTICATION BASELINE
// Every protected route returns 401 when no token is provided
// ─────────────────────────────────────────────────────────────────────────────

describe("Authentication baseline — no token returns 401", () => {
    const protectedRoutes = [
        { method: "get", path: "/api/assets" },
        { method: "post", path: "/api/assets" },
        { method: "get", path: `/api/assets/${TEST_IDS.assetId}` },
        { method: "patch", path: `/api/assets/${TEST_IDS.assetId}` },
        { method: "delete", path: `/api/assets/${TEST_IDS.assetId}` },
        { method: "get", path: "/api/branches" },
        { method: "post", path: "/api/branches" },
        { method: "get", path: "/api/maintenance" },
        { method: "post", path: "/api/maintenance" },
        { method: "get", path: "/api/notifications" },
    ];

    test.each(protectedRoutes)(
        "$method $path returns 401 without token",
        async ({ method, path }) => {
            const res = await (request(app) as any)[method](path);
            expect(res.status).toBe(401);
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — ASSET ROUTES: READ ACCESS
// ─────────────────────────────────────────────────────────────────────────────

describe("Asset read access — GET /api/assets", () => {

    it("Admin can list assets", async () => {
        const res = await request(app)
            .get("/api/assets")
            .set("Authorization", `Bearer ${adminToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Asset Manager can list assets", async () => {
        const res = await request(app)
            .get("/api/assets")
            .set("Authorization", `Bearer ${assetManagerToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Finance User can list assets", async () => {
        const res = await request(app)
            .get("/api/assets")
            .set("Authorization", `Bearer ${financeToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Auditor can list assets", async () => {
        const res = await request(app)
            .get("/api/assets")
            .set("Authorization", `Bearer ${auditorToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Branch Manager can list assets (scoped to own branch)", async () => {
        const res = await request(app)
            .get("/api/assets")
            .set("Authorization", `Bearer ${branchManagerToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Maintenance Staff can list assets (scoped to assigned only)", async () => {
        const res = await request(app)
            .get("/api/assets")
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Standard Staff can list assets (scoped to assigned only)", async () => {
        const res = await request(app)
            .get("/api/assets")
            .set("Authorization", `Bearer ${standardStaffToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — ASSET ROUTES: CREATE ACCESS
// Only Admin, Asset Manager, Branch Manager (own branch) can create
// ─────────────────────────────────────────────────────────────────────────────

describe("Asset create access — POST /api/assets", () => {

    const validAssetBody = {
        name: "Test Create Asset",
        assetTag: `TST-CREATE-${Date.now()}`,
        purchaseCost: 10000,
        status: "active",
        condition: "good",
    };

    it("Admin can create an asset", async () => {
        const res = await request(app)
            .post("/api/assets")
            .set("Authorization", `Bearer ${adminToken()}`)
            .send({ ...validAssetBody, assetTag: `TST-ADMIN-${Date.now()}` });
        // 201 created or 400/422 validation — NOT 401 or 403
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Asset Manager can create an asset", async () => {
        const res = await request(app)
            .post("/api/assets")
            .set("Authorization", `Bearer ${assetManagerToken()}`)
            .send({ ...validAssetBody, assetTag: `TST-AM-${Date.now()}` });
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Finance User CANNOT create an asset", async () => {
        const res = await request(app)
            .post("/api/assets")
            .set("Authorization", `Bearer ${financeToken()}`)
            .send(validAssetBody);
        expect(res.status).toBe(403);
    });

    it("Auditor CANNOT create an asset", async () => {
        const res = await request(app)
            .post("/api/assets")
            .set("Authorization", `Bearer ${auditorToken()}`)
            .send(validAssetBody);
        expect(res.status).toBe(403);
    });

    it("Maintenance Staff CANNOT create an asset", async () => {
        const res = await request(app)
            .post("/api/assets")
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`)
            .send(validAssetBody);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT create an asset", async () => {
        const res = await request(app)
            .post("/api/assets")
            .set("Authorization", `Bearer ${standardStaffToken()}`)
            .send(validAssetBody);
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — ASSET ROUTES: DELETE ACCESS
// Only Admin and Asset Manager can delete
// ─────────────────────────────────────────────────────────────────────────────

describe("Asset delete access — DELETE /api/assets/:id", () => {

    it("Admin can delete an asset", async () => {
        const res = await request(app)
            .delete(`/api/assets/${TEST_IDS.assetId}`)
            .set("Authorization", `Bearer ${adminToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Asset Manager can delete an asset", async () => {
        const res = await request(app)
            .delete(`/api/assets/${TEST_IDS.assetId}`)
            .set("Authorization", `Bearer ${assetManagerToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Finance User CANNOT delete an asset", async () => {
        const res = await request(app)
            .delete(`/api/assets/${TEST_IDS.assetId}`)
            .set("Authorization", `Bearer ${financeToken()}`);
        expect(res.status).toBe(403);
    });

    it("Auditor CANNOT delete an asset", async () => {
        const res = await request(app)
            .delete(`/api/assets/${TEST_IDS.assetId}`)
            .set("Authorization", `Bearer ${auditorToken()}`);
        expect(res.status).toBe(403);
    });

    it("Branch Manager CANNOT delete an asset", async () => {
        const res = await request(app)
            .delete(`/api/assets/${TEST_IDS.assetId}`)
            .set("Authorization", `Bearer ${branchManagerToken()}`);
        expect(res.status).toBe(403);
    });

    it("Maintenance Staff CANNOT delete an asset", async () => {
        const res = await request(app)
            .delete(`/api/assets/${TEST_IDS.assetId}`)
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT delete an asset", async () => {
        const res = await request(app)
            .delete(`/api/assets/${TEST_IDS.assetId}`)
            .set("Authorization", `Bearer ${standardStaffToken()}`);
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — ASSET ROUTES: DISPOSE ACCESS
// Asset Manager initiates. Finance/Admin approve above threshold.
// Branch Manager, Maintenance, Standard Staff cannot dispose.
// ─────────────────────────────────────────────────────────────────────────────

describe("Asset dispose access — POST /api/assets/:id/dispose", () => {

    const disposeBody = {
        method: "sold",
        reason: "Asset replaced by newer model",
        proceeds: 5000,
    };

    it("Admin can dispose an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/dispose`)
            .set("Authorization", `Bearer ${adminToken()}`)
            .send(disposeBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Asset Manager can dispose an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/dispose`)
            .set("Authorization", `Bearer ${assetManagerToken()}`)
            .send(disposeBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Auditor CANNOT dispose an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/dispose`)
            .set("Authorization", `Bearer ${auditorToken()}`)
            .send(disposeBody);
        expect(res.status).toBe(403);
    });

    it("Branch Manager CANNOT dispose an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/dispose`)
            .set("Authorization", `Bearer ${branchManagerToken()}`)
            .send(disposeBody);
        expect(res.status).toBe(403);
    });

    it("Maintenance Staff CANNOT dispose an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/dispose`)
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`)
            .send(disposeBody);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT dispose an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/dispose`)
            .set("Authorization", `Bearer ${standardStaffToken()}`)
            .send(disposeBody);
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — ASSET ROUTES: IMPORT ACCESS
// Only Admin and Asset Manager can import
// ─────────────────────────────────────────────────────────────────────────────

describe("Asset import access — POST /api/assets/import", () => {

    it("Finance User CANNOT import assets", async () => {
        const res = await request(app)
            .post("/api/assets/import")
            .set("Authorization", `Bearer ${financeToken()}`);
        expect(res.status).toBe(403);
    });

    it("Auditor CANNOT import assets", async () => {
        const res = await request(app)
            .post("/api/assets/import")
            .set("Authorization", `Bearer ${auditorToken()}`);
        expect(res.status).toBe(403);
    });

    it("Branch Manager CANNOT import assets", async () => {
        const res = await request(app)
            .post("/api/assets/import")
            .set("Authorization", `Bearer ${branchManagerToken()}`);
        expect(res.status).toBe(403);
    });

    it("Maintenance Staff CANNOT import assets", async () => {
        const res = await request(app)
            .post("/api/assets/import")
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT import assets", async () => {
        const res = await request(app)
            .post("/api/assets/import")
            .set("Authorization", `Bearer ${standardStaffToken()}`);
        expect(res.status).toBe(403);
    });

    it("Admin gets past permission check (may fail on file validation)", async () => {
        const res = await request(app)
            .post("/api/assets/import")
            .set("Authorization", `Bearer ${adminToken()}`);
        // 400 = passed auth/permission, failed file validation — correct
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — ASSET ROUTES: DEPRECIATION ACCESS
// Admin, Asset Manager, Finance can record depreciation
// All others blocked
// ─────────────────────────────────────────────────────────────────────────────

describe("Depreciation record access — POST /api/assets/:id/depreciation", () => {

    const depreciationBody = {
        fiscalYear: 2025,
        depreciationMethod: "straight_line",
        periodUsedPriorYears: 0,
        periodUsedCurrentYear: 12,
        accumulatedDepreciationBf: 0,
        yearlyDepCharge: 5000,
        totalAccumulatedDepreciation: 5000,
    };

    it("Admin can record depreciation", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/depreciation`)
            .set("Authorization", `Bearer ${adminToken()}`)
            .send(depreciationBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Asset Manager can record depreciation", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/depreciation`)
            .set("Authorization", `Bearer ${assetManagerToken()}`)
            .send(depreciationBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Finance User can record depreciation", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/depreciation`)
            .set("Authorization", `Bearer ${financeToken()}`)
            .send(depreciationBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Auditor CANNOT record depreciation", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/depreciation`)
            .set("Authorization", `Bearer ${auditorToken()}`)
            .send(depreciationBody);
        expect(res.status).toBe(403);
    });

    it("Branch Manager CANNOT record depreciation", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/depreciation`)
            .set("Authorization", `Bearer ${branchManagerToken()}`)
            .send(depreciationBody);
        expect(res.status).toBe(403);
    });

    it("Maintenance Staff CANNOT record depreciation", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/depreciation`)
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`)
            .send(depreciationBody);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT record depreciation", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/depreciation`)
            .set("Authorization", `Bearer ${standardStaffToken()}`)
            .send(depreciationBody);
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — BRANCH ROUTES
// ─────────────────────────────────────────────────────────────────────────────

describe("Branch read access — GET /api/branches", () => {

    it("Admin can list branches", async () => {
        const res = await request(app)
            .get("/api/branches")
            .set("Authorization", `Bearer ${adminToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Asset Manager can list branches", async () => {
        const res = await request(app)
            .get("/api/branches")
            .set("Authorization", `Bearer ${assetManagerToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Finance User can list branches", async () => {
        const res = await request(app)
            .get("/api/branches")
            .set("Authorization", `Bearer ${financeToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Auditor can list branches", async () => {
        const res = await request(app)
            .get("/api/branches")
            .set("Authorization", `Bearer ${auditorToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Branch Manager can list branches (scoped to own)", async () => {
        const res = await request(app)
            .get("/api/branches")
            .set("Authorization", `Bearer ${branchManagerToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Maintenance Staff can list branches (own branch)", async () => {
        const res = await request(app)
            .get("/api/branches")
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Standard Staff CANNOT list branches", async () => {
        const res = await request(app)
            .get("/api/branches")
            .set("Authorization", `Bearer ${standardStaffToken()}`);
        expect(res.status).toBe(403);
    });
});

describe("Branch create access — POST /api/branches", () => {

    const branchBody = {
        name: `Test Branch ${Date.now()}`,
        code: `TB${Date.now()}`,
    };

    it("Admin can create a branch", async () => {
        const res = await request(app)
            .post("/api/branches")
            .set("Authorization", `Bearer ${adminToken()}`)
            .send({ ...branchBody, name: `Admin Branch ${Date.now()}` });
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Asset Manager can create a branch", async () => {
        const res = await request(app)
            .post("/api/branches")
            .set("Authorization", `Bearer ${assetManagerToken()}`)
            .send({ ...branchBody, name: `AM Branch ${Date.now()}` });
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Finance User CANNOT create a branch", async () => {
        const res = await request(app)
            .post("/api/branches")
            .set("Authorization", `Bearer ${financeToken()}`)
            .send(branchBody);
        expect(res.status).toBe(403);
    });

    it("Auditor CANNOT create a branch", async () => {
        const res = await request(app)
            .post("/api/branches")
            .set("Authorization", `Bearer ${auditorToken()}`)
            .send(branchBody);
        expect(res.status).toBe(403);
    });

    it("Branch Manager CANNOT create a branch", async () => {
        const res = await request(app)
            .post("/api/branches")
            .set("Authorization", `Bearer ${branchManagerToken()}`)
            .send(branchBody);
        expect(res.status).toBe(403);
    });

    it("Maintenance Staff CANNOT create a branch", async () => {
        const res = await request(app)
            .post("/api/branches")
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`)
            .send(branchBody);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT create a branch", async () => {
        const res = await request(app)
            .post("/api/branches")
            .set("Authorization", `Bearer ${standardStaffToken()}`)
            .send(branchBody);
        expect(res.status).toBe(403);
    });
});

describe("Branch delete access — DELETE /api/branches/:id", () => {

    it("Finance User CANNOT delete a branch", async () => {
        const res = await request(app)
            .delete(`/api/branches/${TEST_IDS.branchId}`)
            .set("Authorization", `Bearer ${financeToken()}`);
        expect(res.status).toBe(403);
    });

    it("Auditor CANNOT delete a branch", async () => {
        const res = await request(app)
            .delete(`/api/branches/${TEST_IDS.branchId}`)
            .set("Authorization", `Bearer ${auditorToken()}`);
        expect(res.status).toBe(403);
    });

    it("Branch Manager CANNOT delete a branch", async () => {
        const res = await request(app)
            .delete(`/api/branches/${TEST_IDS.branchId}`)
            .set("Authorization", `Bearer ${branchManagerToken()}`);
        expect(res.status).toBe(403);
    });

    it("Maintenance Staff CANNOT delete a branch", async () => {
        const res = await request(app)
            .delete(`/api/branches/${TEST_IDS.branchId}`)
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT delete a branch", async () => {
        const res = await request(app)
            .delete(`/api/branches/${TEST_IDS.branchId}`)
            .set("Authorization", `Bearer ${standardStaffToken()}`);
        expect(res.status).toBe(403);
    });

    it("Admin gets past permission check on branch delete", async () => {
        const res = await request(app)
            .delete(`/api/branches/${TEST_IDS.branchId}`)
            .set("Authorization", `Bearer ${adminToken()}`);
        // May be 409 (has assets) or 200 — NOT 403 or 401
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — MAINTENANCE ROUTES
// ─────────────────────────────────────────────────────────────────────────────

describe("Maintenance read access — GET /api/maintenance", () => {

    it("Admin can list maintenance tasks", async () => {
        const res = await request(app)
            .get("/api/maintenance")
            .set("Authorization", `Bearer ${adminToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Asset Manager can list maintenance tasks", async () => {
        const res = await request(app)
            .get("/api/maintenance")
            .set("Authorization", `Bearer ${assetManagerToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Branch Manager can list maintenance tasks (own branch)", async () => {
        const res = await request(app)
            .get("/api/maintenance")
            .set("Authorization", `Bearer ${branchManagerToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Maintenance Staff can list own assigned tasks", async () => {
        const res = await request(app)
            .get("/api/maintenance")
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Auditor can list maintenance tasks (read only)", async () => {
        const res = await request(app)
            .get("/api/maintenance")
            .set("Authorization", `Bearer ${auditorToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Finance User CANNOT list maintenance tasks", async () => {
        const res = await request(app)
            .get("/api/maintenance")
            .set("Authorization", `Bearer ${financeToken()}`);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT list maintenance tasks broadly", async () => {
        const res = await request(app)
            .get("/api/maintenance")
            .set("Authorization", `Bearer ${standardStaffToken()}`);
        expect(res.status).toBe(403);
    });
});

describe("Maintenance create access — POST /api/maintenance", () => {

    const maintenanceBody = {
        assetId: TEST_IDS.assetId,
        title: "Routine inspection",
        priority: "medium",
    };

    it("Admin can create a maintenance task", async () => {
        const res = await request(app)
            .post("/api/maintenance")
            .set("Authorization", `Bearer ${adminToken()}`)
            .send(maintenanceBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Asset Manager can create a maintenance task", async () => {
        const res = await request(app)
            .post("/api/maintenance")
            .set("Authorization", `Bearer ${assetManagerToken()}`)
            .send(maintenanceBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Branch Manager can create a maintenance task (own branch)", async () => {
        const res = await request(app)
            .post("/api/maintenance")
            .set("Authorization", `Bearer ${branchManagerToken()}`)
            .send(maintenanceBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Maintenance Staff can create a task for own assigned asset", async () => {
        const res = await request(app)
            .post("/api/maintenance")
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`)
            .send(maintenanceBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Finance User CANNOT create a maintenance task", async () => {
        const res = await request(app)
            .post("/api/maintenance")
            .set("Authorization", `Bearer ${financeToken()}`)
            .send(maintenanceBody);
        expect(res.status).toBe(403);
    });

    it("Auditor CANNOT create a maintenance task", async () => {
        const res = await request(app)
            .post("/api/maintenance")
            .set("Authorization", `Bearer ${auditorToken()}`)
            .send(maintenanceBody);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT create a maintenance task", async () => {
        const res = await request(app)
            .post("/api/maintenance")
            .set("Authorization", `Bearer ${standardStaffToken()}`)
            .send(maintenanceBody);
        expect(res.status).toBe(403);
    });
});

describe("Maintenance complete access — PATCH /api/maintenance/:id/complete", () => {

    const completeBody = { completionNote: "Task completed successfully" };

    it("Admin can complete a maintenance task", async () => {
        const res = await request(app)
            .patch(`/api/maintenance/${TEST_IDS.maintenanceTaskId}/complete`)
            .set("Authorization", `Bearer ${adminToken()}`)
            .send(completeBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Maintenance Staff can complete own assigned task", async () => {
        const res = await request(app)
            .patch(`/api/maintenance/${TEST_IDS.maintenanceTaskId}/complete`)
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`)
            .send(completeBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Finance User CANNOT complete a maintenance task", async () => {
        const res = await request(app)
            .patch(`/api/maintenance/${TEST_IDS.maintenanceTaskId}/complete`)
            .set("Authorization", `Bearer ${financeToken()}`)
            .send(completeBody);
        expect(res.status).toBe(403);
    });

    it("Auditor CANNOT complete a maintenance task", async () => {
        const res = await request(app)
            .patch(`/api/maintenance/${TEST_IDS.maintenanceTaskId}/complete`)
            .set("Authorization", `Bearer ${auditorToken()}`)
            .send(completeBody);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT complete a maintenance task", async () => {
        const res = await request(app)
            .patch(`/api/maintenance/${TEST_IDS.maintenanceTaskId}/complete`)
            .set("Authorization", `Bearer ${standardStaffToken()}`)
            .send(completeBody);
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — SCOPE ENFORCEMENT TESTS
// These test the ⚠️ conditional rules from the permission matrix
// ─────────────────────────────────────────────────────────────────────────────

describe("Branch Manager scope — can only access own branch assets", () => {

    it("Branch Manager CANNOT access an asset in another branch", async () => {
        const res = await request(app)
            .get(`/api/assets/${TEST_IDS.otherBranchAssetId}`)
            .set("Authorization", `Bearer ${branchManagerToken()}`);
        // Must be 403 — other branch asset is out of scope
        expect(res.status).toBe(403);
    });

    it("Branch Manager CAN access an asset in own branch", async () => {
        const res = await request(app)
            .get(`/api/assets/${TEST_IDS.assetId}`)
            .set("Authorization", `Bearer ${branchManagerToken()}`);
        // Must NOT be 403
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });

    it("Branch Manager CANNOT update an asset in another branch", async () => {
        const res = await request(app)
            .patch(`/api/assets/${TEST_IDS.otherBranchAssetId}`)
            .set("Authorization", `Bearer ${branchManagerToken()}`)
            .send({ name: "Renamed Asset" });
        expect(res.status).toBe(403);
    });

    it("Branch Manager CANNOT transfer an asset from another branch", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.otherBranchAssetId}/transfer`)
            .set("Authorization", `Bearer ${branchManagerToken()}`)
            .send({
                toBranchId: TEST_IDS.branchId,
                reason: "Moving asset",
            });
        expect(res.status).toBe(403);
    });
});

describe("Maintenance Staff scope — can only access own assigned tasks", () => {

    it("Maintenance Staff CAN access own assigned task", async () => {
        const res = await request(app)
            .get(`/api/maintenance/${TEST_IDS.maintenanceTaskId}`)
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`);
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });

    it("Maintenance Staff CANNOT access a task not assigned to them", async () => {
        // Use a random UUID that exists but is not assigned to maintenance user
        const res = await request(app)
            .get(`/api/maintenance/00000000-0000-0000-0000-000000000099`)
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`);
        // 403 (not their task) or 404 (task not found) — NOT the task data
        expect([403, 404]).toContain(res.status);
    });
});

describe("Auditor scope — zero write access", () => {

    it("Auditor CANNOT update an asset", async () => {
        const res = await request(app)
            .patch(`/api/assets/${TEST_IDS.assetId}`)
            .set("Authorization", `Bearer ${auditorToken()}`)
            .send({ name: "Auditor renamed" });
        expect(res.status).toBe(403);
    });

    it("Auditor CANNOT transfer an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/transfer`)
            .set("Authorization", `Bearer ${auditorToken()}`)
            .send({ toBranchId: TEST_IDS.otherBranchId });
        expect(res.status).toBe(403);
    });

    it("Auditor CANNOT restore an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/restore`)
            .set("Authorization", `Bearer ${auditorToken()}`)
            .send({ reason: "Restoring" });
        expect(res.status).toBe(403);
    });

    it("Auditor CAN view asset list", async () => {
        const res = await request(app)
            .get("/api/assets")
            .set("Authorization", `Bearer ${auditorToken()}`);
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });

    it("Auditor CAN view audit summary", async () => {
        const res = await request(app)
            .get("/api/assets/audit")
            .set("Authorization", `Bearer ${auditorToken()}`);
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });
});

describe("Standard Staff scope — own assignments only", () => {

    it("Standard Staff CANNOT create assets", async () => {
        const res = await request(app)
            .post("/api/assets")
            .set("Authorization", `Bearer ${standardStaffToken()}`)
            .send({ name: "My Asset", assetTag: "MINE-001", purchaseCost: 500 });
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT delete assets", async () => {
        const res = await request(app)
            .delete(`/api/assets/${TEST_IDS.assetId}`)
            .set("Authorization", `Bearer ${standardStaffToken()}`);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT export assets", async () => {
        const res = await request(app)
            .get("/api/assets/export")
            .set("Authorization", `Bearer ${standardStaffToken()}`);
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — EXPORT ACCESS
// ─────────────────────────────────────────────────────────────────────────────

describe("Asset export access — GET /api/assets/export", () => {

    it("Admin can export assets", async () => {
        const res = await request(app)
            .get("/api/assets/export")
            .set("Authorization", `Bearer ${adminToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Asset Manager can export assets", async () => {
        const res = await request(app)
            .get("/api/assets/export")
            .set("Authorization", `Bearer ${assetManagerToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Finance User can export assets", async () => {
        const res = await request(app)
            .get("/api/assets/export")
            .set("Authorization", `Bearer ${financeToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Auditor can export assets", async () => {
        const res = await request(app)
            .get("/api/assets/export")
            .set("Authorization", `Bearer ${auditorToken()}`);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Maintenance Staff CANNOT export assets", async () => {
        const res = await request(app)
            .get("/api/assets/export")
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT export assets", async () => {
        const res = await request(app)
            .get("/api/assets/export")
            .set("Authorization", `Bearer ${standardStaffToken()}`);
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12 — RESTORE ACCESS
// Only Admin and Asset Manager
// ─────────────────────────────────────────────────────────────────────────────

describe("Asset restore access — POST /api/assets/:id/restore", () => {

    const restoreBody = { reason: "Restoring mistakenly deleted asset", targetStatus: "active" };

    it("Admin can restore an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/restore`)
            .set("Authorization", `Bearer ${adminToken()}`)
            .send(restoreBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Asset Manager can restore an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/restore`)
            .set("Authorization", `Bearer ${assetManagerToken()}`)
            .send(restoreBody);
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(403);
    });

    it("Finance User CANNOT restore an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/restore`)
            .set("Authorization", `Bearer ${financeToken()}`)
            .send(restoreBody);
        expect(res.status).toBe(403);
    });

    it("Branch Manager CANNOT restore an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/restore`)
            .set("Authorization", `Bearer ${branchManagerToken()}`)
            .send(restoreBody);
        expect(res.status).toBe(403);
    });

    it("Maintenance Staff CANNOT restore an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/restore`)
            .set("Authorization", `Bearer ${maintenanceStaffToken()}`)
            .send(restoreBody);
        expect(res.status).toBe(403);
    });

    it("Standard Staff CANNOT restore an asset", async () => {
        const res = await request(app)
            .post(`/api/assets/${TEST_IDS.assetId}/restore`)
            .set("Authorization", `Bearer ${standardStaffToken()}`)
            .send(restoreBody);
        expect(res.status).toBe(403);
    });
});