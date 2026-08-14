import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (value === "" || value === null) return undefined;
  return value;
};

const uuidSchema = z.uuid();
const optionalUuid = z.preprocess(emptyToUndefined, z.uuid().optional());
const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

export const maintenanceParamsSchema = z.object({
  id: uuidSchema,
});

export const maintenanceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
  assignedTo: optionalUuid,
  assetId: optionalUuid,
});

export const createMaintenanceSchema = z.object({
  assetId: uuidSchema,
  title: z.string().trim().min(2).max(200),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(5000).optional()),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  dueAt: optionalDate,
  assignedTo: optionalUuid,
});

export const updateMaintenanceSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
    dueAt: z.coerce.date().nullable().optional(),
    assignedTo: uuidSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  });

export const completeMaintenanceSchema = z
  .object({
    note: z.string().trim().max(2000).optional(),
    completionNote: z.string().trim().max(2000).optional(),
    completedAt: optionalDate,
  })
  .transform((value) => ({
    note: value.note ?? value.completionNote,
    completedAt: value.completedAt,
  }));
