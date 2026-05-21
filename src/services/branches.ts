import {
  createBranch,
  findBranchById,
  listBranches,
  softDeleteBranchById,
  updateBranchById,
} from "../repositories/branches";
import { CreateBranchInput, UpdateBranchInput } from "../types/branches";
import { NotFoundError } from "../utils/error";

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
) => {
  const record = await softDeleteBranchById(organizationId, branchId, actorUserId);
  if (!record) throw new NotFoundError("Branch");
  return record;
};
