import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import * as maintenanceController from "../controllers/maintenance";

export const maintenanceRouter = Router();

maintenanceRouter.use(requireAuth);

maintenanceRouter.get("/", maintenanceController.listMaintenance);
maintenanceRouter.post("/", maintenanceController.createMaintenance);
maintenanceRouter.get("/:id", maintenanceController.getMaintenanceById);
maintenanceRouter.patch("/:id", maintenanceController.updateMaintenance);
maintenanceRouter.patch("/:id/complete", maintenanceController.completeMaintenance);
