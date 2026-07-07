import { Router } from "express";
import * as branchesController from "../controllers/branches";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/authorize";
import { PERMISSIONS } from "../types/roles";

export const branchesRouter = Router();

branchesRouter.use(requireAuth);

branchesRouter.get(
    "/",
    requirePermission(PERMISSIONS.BRANCH_READ),
    branchesController.listBranches,
);
branchesRouter.post(
    "/",
    requirePermission(PERMISSIONS.BRANCH_CREATE),
    branchesController.createBranch,
);
branchesRouter.get(
    "/:id",
    requirePermission(PERMISSIONS.BRANCH_READ),
    branchesController.getBranchById,
);
branchesRouter.patch(
    "/:id",
    requirePermission(PERMISSIONS.BRANCH_UPDATE),
    branchesController.updateBranch,
);
branchesRouter.delete(
    "/:id",
    requirePermission(PERMISSIONS.BRANCH_DELETE),
    branchesController.deleteBranch,
);