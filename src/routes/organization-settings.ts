import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as orgSettingsController from "../controllers/organization-settings";
import { requirePermission } from "../middlewares/permission";

export const organizationSettingsRouter = Router();

organizationSettingsRouter.get(
    "/",
    requirePermission(PERMISSIONS.ORGANIZATION_SETTINGS_READ),
    orgSettingsController.getSettings,
);

organizationSettingsRouter.patch(
    "/",
    requirePermission(PERMISSIONS.ORGANIZATION_SETTINGS_UPDATE),
    orgSettingsController.updateSettings,
);
