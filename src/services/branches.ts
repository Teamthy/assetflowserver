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

export const createBranchService = async (
  organizationId: string,
  actorUserId: string,
  payload: CreateBranchInput,
) => createBranch(organizationId, actorUserId, payload);

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
  return record;
};
