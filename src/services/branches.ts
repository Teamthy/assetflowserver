import {
  countActiveAssetsInBranch,
  createBranch,
  findBranchById,
  listBranches,
  softDeleteBranchById,
  updateBranchById,
} from "../repositories/branches";
import { CreateBranchInput, UpdateBranchInput } from "../types/branches";
import { ConflictError, NotFoundError } from "../utils/error";
import { logger } from "../utils/logger";
import { notifyOrganizationAdmins } from "./notifications";

export const createBranchService = async (
  organizationId: string,
  actorUserId: string,
  payload: CreateBranchInput,
) => {
  const record = await createBranch(organizationId, actorUserId, payload);
  if (!record) {
    throw new NotFoundError("Branch");
  }
  logger.info("Branch created", {
    organizationId,
    actorUserId,
    branchId: record.id,
    branchName: record.name,
  });
  await notifyOrganizationAdmins({
    organizationId,
    type: "branch_created",
    title: "Branch created",
    message: `${record.name} branch has been created.`,
    metadata: {
      branchId: record.id,
      actorUserId,
      redirectUrl: `/branches/${record.id}`,
    },
  });
  return record;
};

export const listBranchesService = async (organizationId: string) =>
  listBranches(organizationId);

export const getBranchByIdService = async (organizationId: string, branchId: string) => {
  const record = await findBranchById(organizationId, branchId);
  if (!record) throw new NotFoundError("Branch");
  return record;
};

export const updateBranchService = async (
  organizationId: string,
  branchId: string,
  actorUserId: string,
  payload: UpdateBranchInput,
) => {
  const record = await updateBranchById(organizationId, branchId, actorUserId, payload);
  if (!record) throw new NotFoundError("Branch");
  logger.info("Branch updated", { organizationId, actorUserId, branchId });
  await notifyOrganizationAdmins({
    organizationId,
    type: "branch_updated",
    title: "Branch updated",
    message: `${record.name} branch has been updated.`,
    metadata: {
      branchId: record.id,
      actorUserId,
      redirectUrl: `/branches/${record.id}`,
    },
  });
  return record;
};

export const deleteBranchService = async (
  organizationId: string,
  branchId: string,
  actorUserId: string,
  force = false,
) => {
  if (!force) {
    const activeAssetsCount = await countActiveAssetsInBranch(organizationId, branchId);
    if (activeAssetsCount > 0) {
      throw new ConflictError(
        `Cannot delete branch with ${activeAssetsCount} active assets. Reassign assets first or retry with force=true.`,
      );
    }
  }

  const record = await softDeleteBranchById(organizationId, branchId, actorUserId);
  if (!record) throw new NotFoundError("Branch");
  logger.warn("Branch soft-deleted", { organizationId, actorUserId, branchId, force });
  return record;
};
