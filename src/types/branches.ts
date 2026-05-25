import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { branches } from "../model/branch";
import {
  branchParamsSchema,
  createBranchSchema,
  updateBranchSchema,
} from "../validators/branches";
import { z } from "zod";

export type Branch = InferSelectModel<typeof branches>;
export type NewBranch = InferInsertModel<typeof branches>;

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type BranchParams = z.infer<typeof branchParamsSchema>;
