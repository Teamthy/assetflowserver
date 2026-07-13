import { Router } from "express";
import * as branchesController from "../controllers/branches";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";
import { requireBranchScope, requireNotReadOnly } from "../middlewares/scope";
import { PERMISSIONS } from "../config/permissions";

export const branchesRouter = Router();

branchesRouter.use(requireAuth);

// ─── List Branches ────────────────────────────────────────────────────────────
// Branch Managers see own branch only (scope injected by requireBranchScope)
// Maintenance Staff see own branch only (same)
// Auditor, Finance, Asset Manager, Admin see all
branchesRouter.get(
    "/",
    requirePermission(PERMISSIONS.BRANCH_READ),
    requireBranchScope("branch"),
    branchesController.listBranches
);

// ─── Create Branch ────────────────────────────────────────────────────────────
// Admin and Asset Manager only
// Branch Manager cannot create branches
branchesRouter.post(
    "/",
    requirePermission(PERMISSIONS.BRANCH_CREATE),
    requireNotReadOnly,
    branchesController.createBranch
);

// ─── Get Branch By ID ─────────────────────────────────────────────────────────
// Branch Manager can only view own branch (enforced by scope)
branchesRouter.get(
    "/:id",
    requirePermission(PERMISSIONS.BRANCH_READ),
    requireBranchScope("branch"),
    branchesController.getBranchById
);

// ─── Update Branch ────────────────────────────────────────────────────────────
// Admin and Asset Manager: any branch
// Branch Manager: own branch only (enforced by scope)
branchesRouter.patch(
    "/:id",
    requirePermission(PERMISSIONS.BRANCH_UPDATE),
    requireNotReadOnly,
    requireBranchScope("branch"),
    branchesController.updateBranch
);

// ─── Delete Branch ────────────────────────────────────────────────────────────
// Standard delete: Admin and Asset Manager only
// Force delete (query ?force=true): Admin only — enforced in controller
// Branch Manager cannot delete any branch
branchesRouter.delete(
    "/:id",
    requirePermission(PERMISSIONS.BRANCH_DELETE),
    requireNotReadOnly,
    branchesController.deleteBranch
);