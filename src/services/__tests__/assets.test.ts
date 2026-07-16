jest.mock("../../repositories/assets", () => ({
  createAsset: jest.fn(),
  disposeAssetById: jest.fn(),
  findAssetById: jest.fn(),
  listAssetDisposals: jest.fn(),
  listAssetDepreciationSnapshots: jest.fn(),
  listAssetLifecycleEvents: jest.fn(),
  listAssets: jest.fn(),
  listAssetTransfers: jest.fn(),
  listWarrantyExpiringAssets: jest.fn(),
  recordAssetDepreciation: jest.fn(),
  restoreAssetById: jest.fn(),
  softDeleteAssetById: jest.fn(),
  transferAsset: jest.fn(),
  updateAssetById: jest.fn(),
}));

jest.mock("../../repositories/organizations", () => ({
  findOrganizationById: jest.fn(),
}));

jest.mock("../../repositories/maintenance", () => ({
  listMaintenanceTasks: jest.fn(),
}));

jest.mock("../../db", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("../notifications", () => ({
  createInAppNotification: jest.fn(),
  notifyDepreciationRunCompleted: jest.fn(),
  notifyOrganizationAdmins: jest.fn(),
  notifyWarrantyExpiringSoon: jest.fn(),
}));

import {
  createAsset,
  disposeAssetById,
  findAssetById,
  listAssetDepreciationSnapshots,
  listAssetDisposals,
  listAssetLifecycleEvents,
  listAssetTransfers,
} from "../../repositories/assets";
import { listMaintenanceTasks } from "../../repositories/maintenance";
import { findOrganizationById } from "../../repositories/organizations";
import { db } from "../../db";
import {
  createAssetService,
  disposeAssetService,
  getAssetTimelineService,
  updateAssetService,
} from "../assets";
import {
  createInAppNotification,
  notifyOrganizationAdmins,
} from "../notifications";
import { ValidationError } from "../../utils/error";

const organizationId = "64c9cabe-4970-4c6f-aacc-975ca8d31da0";
const actorUserId = "2d0bcc62-01a0-4dbd-a670-7ce9c2cd94f8";
const assignedUserId = "52c2865c-1d09-4c13-9be8-a0dd6860675f";
const assetId = "ac390e17-fb79-4b20-9616-a43951560481";

const assetRecord = {
  id: assetId,
  organizationId,
  name: "HP EliteBook",
  assetTag: "AST-001",
  assignedTo: assignedUserId,
  branchId: null,
  status: "active",
  condition: "good",
  purchaseCost: "1500.00",
  isDepreciable: true,
  hasFutureEconomicBenefit: true,
  costCanBeReliablyMeasured: true,
  recognitionStatus: "recognized",
  accountingTreatment: "capitalized",
  recognitionReasons: ["Asset meets recognition and capitalization criteria."],
  capitalizationThresholdApplied: "50000",
};

describe("assets service", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(db.select).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ userId: assignedUserId }]),
        }),
      }),
    } as never);
  });

  it("registers an asset and notifies the assigned user", async () => {
    jest.mocked(findOrganizationById).mockResolvedValue({
      id: organizationId,
      multiBranchEnabled: false,
    });
    jest.mocked(createAsset).mockResolvedValue(assetRecord as never);

    const result = await createAssetService(organizationId, actorUserId, {
      name: "HP EliteBook",
      assetTag: "AST-001",
      assignedTo: assignedUserId,
      purchaseCost: 1500,
      status: "active",
      condition: "good",
      isDepreciable: true,
      hasFutureEconomicBenefit: true,
      costCanBeReliablyMeasured: true,
      expectedUsefulLifeMonths: 36,
    });

    expect(createAsset).toHaveBeenCalledWith(
      organizationId,
      actorUserId,
      expect.objectContaining({ assetTag: "AST-001" }),
    );
    expect(createInAppNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId,
        userId: assignedUserId,
        type: "asset_assigned",
      }),
    );
    expect(result).toEqual(assetRecord);
  });

  it("requires a branch when multi-branch mode is enabled", async () => {
    jest.mocked(findOrganizationById).mockResolvedValue({
      id: organizationId,
      multiBranchEnabled: true,
    });

    await expect(
      createAssetService(organizationId, actorUserId, {
        name: "HP EliteBook",
        assetTag: "AST-001",
        purchaseCost: 1500,
        status: "active",
        condition: "good",
        isDepreciable: true,
        hasFutureEconomicBenefit: true,
        costCanBeReliablyMeasured: true,
        expectedUsefulLifeMonths: 36,
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(createAsset).not.toHaveBeenCalled();
  });

  it("rejects asset assignment to a user outside the organization", async () => {
    jest.mocked(findOrganizationById).mockResolvedValue({
      id: organizationId,
      multiBranchEnabled: false,
    });
    jest.mocked(db.select).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    } as never);

    await expect(
      createAssetService(organizationId, actorUserId, {
        name: "HP EliteBook",
        assetTag: "AST-001",
        assignedTo: assignedUserId,
        purchaseCost: 1500,
        status: "active",
        condition: "good",
        isDepreciable: true,
        hasFutureEconomicBenefit: true,
        costCanBeReliablyMeasured: true,
        expectedUsefulLifeMonths: 36,
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(createAsset).not.toHaveBeenCalled();
  });

  it("prevents disposal through the generic update endpoint", async () => {
    await expect(
      updateAssetService(organizationId, assetId, actorUserId, {
        status: "disposed",
      } as never),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("returns a unified asset lifecycle timeline", async () => {
    jest.mocked(findAssetById).mockResolvedValue(assetRecord as never);
    jest.mocked(listAssetLifecycleEvents).mockResolvedValue({
      data: [{ eventType: "registered" }],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    } as never);
    jest.mocked(listAssetTransfers).mockResolvedValue([] as never);
    jest.mocked(listMaintenanceTasks).mockResolvedValue({
      data: [{ id: "maintenance-1" }],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    } as never);
    jest.mocked(listAssetDepreciationSnapshots).mockResolvedValue([] as never);
    jest.mocked(listAssetDisposals).mockResolvedValue([] as never);

    const result = await getAssetTimelineService(organizationId, assetId, {
      page: 1,
      limit: 50,
    });

    expect(result.asset).toEqual(assetRecord);
    expect(result.lifecycle.data).toEqual([{ eventType: "registered" }]);
    expect(result.maintenance).toEqual([{ id: "maintenance-1" }]);
  });

  it("disposes an asset and notifies its assignee and organization admins", async () => {
    jest.mocked(findAssetById).mockResolvedValue(assetRecord as never);
    jest.mocked(disposeAssetById).mockResolvedValue({
      asset: { ...assetRecord, status: "disposed", assignedTo: null },
      disposal: {
        id: "c6e66540-29c4-4f97-808c-b1e18e9cd662",
        method: "sold",
      },
    } as never);

    const result = await disposeAssetService(
      organizationId,
      assetId,
      actorUserId,
      {
        method: "sold",
        reason: "Asset replaced",
        proceeds: 500,
      },
    );

    expect(createInAppNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: assignedUserId,
        type: "asset_disposed",
      }),
    );
    expect(notifyOrganizationAdmins).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId,
        type: "asset_disposed",
      }),
    );
    expect(result.disposal.method).toBe("sold");
  });
});
