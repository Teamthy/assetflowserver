import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as orgSettingsController from "../controllers/organization-settings";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";

export const organizationSettingsRouter = Router();

organizationSettingsRouter.use(requireAuth);

organizationSettingsRouter.get(
    "/",
    requirePermission(PERMISSIONS.ORG_SETTINGS_READ),
    orgSettingsController.getSettings
);

organizationSettingsRouter.patch(
    "/",
    requirePermission(PERMISSIONS.ORG_SETTINGS_UPDATE),
    orgSettingsController.updateSettings
);