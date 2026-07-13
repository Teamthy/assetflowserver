// src/middlewares/__tests__/helpers/test-auth.ts

import jwt from "jsonwebtoken";

// Must exactly match JWT_SECRET in your .env file
const JWT_SECRET = "63ee42d363643d0dedee313fe0a443a627e48be1b614eebfb5f9a66dad02193e";

export const TEST_IDS = {
    organizationId: "00000000-0000-0000-0000-000000000001",
    branchId: "00000000-0000-0000-0000-000000000002",
    otherBranchId: "00000000-0000-0000-0000-000000000003",
    adminUserId: "00000000-0000-0000-0000-000000000010",
    assetManagerUserId: "00000000-0000-0000-0000-000000000011",
    financeUserId: "00000000-0000-0000-0000-000000000012",
    auditorUserId: "00000000-0000-0000-0000-000000000013",
    branchManagerUserId: "00000000-0000-0000-0000-000000000014",
    maintenanceUserId: "00000000-0000-0000-0000-000000000015",
    standardUserId: "00000000-0000-0000-0000-000000000016",
    assetId: "00000000-0000-0000-0000-000000000020",
    otherBranchAssetId: "00000000-0000-0000-0000-000000000021",
    maintenanceTaskId: "00000000-0000-0000-0000-000000000030",
};

function makeToken(payload: object): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export const adminToken = () => makeToken({ userId: TEST_IDS.adminUserId, organizationId: TEST_IDS.organizationId });
export const assetManagerToken = () => makeToken({ userId: TEST_IDS.assetManagerUserId, organizationId: TEST_IDS.organizationId });
export const financeToken = () => makeToken({ userId: TEST_IDS.financeUserId, organizationId: TEST_IDS.organizationId });
export const auditorToken = () => makeToken({ userId: TEST_IDS.auditorUserId, organizationId: TEST_IDS.organizationId });
export const branchManagerToken = () => makeToken({ userId: TEST_IDS.branchManagerUserId, organizationId: TEST_IDS.organizationId, branchId: TEST_IDS.branchId });
export const maintenanceStaffToken = () => makeToken({ userId: TEST_IDS.maintenanceUserId, organizationId: TEST_IDS.organizationId });
export const standardStaffToken = () => makeToken({ userId: TEST_IDS.standardUserId, organizationId: TEST_IDS.organizationId });