import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { maintenanceTasks } from "../model/maintenance";
import {
  completeMaintenanceSchema,
  createMaintenanceSchema,
  maintenanceListQuerySchema,
  maintenanceParamsSchema,
  updateMaintenanceSchema,
} from "../validators/maintenance";
import { z } from "zod";

export type MaintenanceTask = InferSelectModel<typeof maintenanceTasks>;
export type NewMaintenanceTask = InferInsertModel<typeof maintenanceTasks>;

export type MaintenanceParams = z.infer<typeof maintenanceParamsSchema>;
export type MaintenanceListQuery = z.infer<typeof maintenanceListQuerySchema>;
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type CompleteMaintenanceInput = z.infer<typeof completeMaintenanceSchema>;

export type MaintenanceListResponse = {
  data: MaintenanceTask[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
