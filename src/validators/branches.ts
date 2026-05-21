import { z } from "zod";

const uuidSchema = z.uuid();

export const createBranchSchema = z.object({
  name: z.string().trim().min(2).max(180),
  code: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(2000).optional(),
});

export const updateBranchSchema = z
  .object({
    name: z.string().trim().min(2).max(180).optional(),
    code: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  });

export const branchParamsSchema = z.object({
  id: uuidSchema,
});
