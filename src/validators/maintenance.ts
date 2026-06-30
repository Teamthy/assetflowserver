import { z } from "zod";

const uuidSchema = z.uuid();

export const maintenanceParamsSchema = z.object({
  id: uuidSchema,
});

export const maintenanceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
  assignedTo: uuidSchema.optional(),
  assetId: uuidSchema.optional(),
});

export const createMaintenanceSchema = z.object({
  assetId: uuidSchema,
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  dueAt: z.coerce.date().optional(),
  assignedTo: uuidSchema.optional(),
});

export const updateMaintenanceSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(5000).optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
    dueAt: z.coerce.date().optional(),
    assignedTo: uuidSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  });

export const completeMaintenanceSchema = z.object({
  note: z.string().trim().max(2000).optional(),
});
