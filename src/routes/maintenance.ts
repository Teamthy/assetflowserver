import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as maintenanceController from "../controllers/maintenance";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";

export const maintenanceRouter = Router();

maintenanceRouter.use(requireAuth);

maintenanceRouter.get(
    "/",
    requirePermission(PERMISSIONS.MAINTENANCE_READ),
    maintenanceController.listMaintenance
);

maintenanceRouter.post(
    "/",
    requirePermission(PERMISSIONS.MAINTENANCE_CREATE),
    maintenanceController.createMaintenance
);

maintenanceRouter.get(
    "/:id",
    requirePermission(PERMISSIONS.MAINTENANCE_READ),
    maintenanceController.getMaintenanceById
);

maintenanceRouter.patch(
    "/:id",
    requirePermission(PERMISSIONS.MAINTENANCE_UPDATE),
    maintenanceController.updateMaintenance
);

maintenanceRouter.patch(
    "/:id/complete",
    requirePermission(PERMISSIONS.MAINTENANCE_COMPLETE),
    maintenanceController.completeMaintenance
);