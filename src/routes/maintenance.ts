import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import * as maintenanceController from "../controllers/maintenance";
import { requirePermission } from "../middlewares/permissions";

export const maintenanceRouter = Router();

maintenanceRouter.use(requireAuth);

maintenanceRouter.get(
  "/",
  requirePermission("maintenance.read"),
  maintenanceController.listMaintenance,
);
maintenanceRouter.post(
  "/",
  requirePermission("maintenance.write"),
  maintenanceController.createMaintenance,
);
maintenanceRouter.get(
  "/:id",
  requirePermission("maintenance.read"),
  maintenanceController.getMaintenanceById,
);
maintenanceRouter.patch(
  "/:id",
  requirePermission("maintenance.write"),
  maintenanceController.updateMaintenance,
);
maintenanceRouter.patch(
  "/:id/complete",
  requirePermission("maintenance.write"),
  maintenanceController.completeMaintenance,
);
