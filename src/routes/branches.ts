import { Router } from "express";
import * as branchesController from "../controllers/branches";
import { requireAuth } from "../middlewares/auth";

export const branchesRouter = Router();

branchesRouter.use(requireAuth);

branchesRouter.get("/", branchesController.listBranches);
branchesRouter.post("/", branchesController.createBranch);
branchesRouter.get("/:id", branchesController.getBranchById);
branchesRouter.patch("/:id", branchesController.updateBranch);
branchesRouter.delete("/:id", branchesController.deleteBranch);
