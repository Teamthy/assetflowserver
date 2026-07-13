import { Router } from "express";
import * as branchesController from "../controllers/branches";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permissions";

export const branchesRouter = Router();

branchesRouter.use(requireAuth);

branchesRouter.get("/", requirePermission("branches.read"), branchesController.listBranches);
branchesRouter.post("/", requirePermission("branches.write"), branchesController.createBranch);
branchesRouter.get("/:id", requirePermission("branches.read"), branchesController.getBranchById);
branchesRouter.patch("/:id", requirePermission("branches.write"), branchesController.updateBranch);
branchesRouter.delete("/:id", requirePermission("branches.write"), branchesController.deleteBranch);
