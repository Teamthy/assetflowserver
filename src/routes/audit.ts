import { Router } from "express";
import { PERMISSIONS } from "../config/permissions";
import * as auditController from "../controllers/audit";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permission";

export const auditRouter = Router();

auditRouter.use(requireAuth);

// ─── Campaigns ────────────────────────────────────────────────────────────────

auditRouter.get(
    "/campaigns",
    requirePermission(PERMISSIONS.AUDIT_CAMPAIGN_READ),
    auditController.listCampaigns
);

auditRouter.post(
    "/campaigns",
    requirePermission(PERMISSIONS.AUDIT_CAMPAIGN_CREATE),
    auditController.createCampaign
);

auditRouter.get(
    "/campaigns/:id",
    requirePermission(PERMISSIONS.AUDIT_CAMPAIGN_READ),
    auditController.getCampaign
);

auditRouter.patch(
    "/campaigns/:id",
    requirePermission(PERMISSIONS.AUDIT_CAMPAIGN_UPDATE),
    auditController.updateCampaign
);

auditRouter.delete(
    "/campaigns/:id",
    requirePermission(PERMISSIONS.AUDIT_CAMPAIGN_DELETE),
    auditController.deleteCampaign
);

auditRouter.post(
    "/campaigns/:id/start",
    requirePermission(PERMISSIONS.AUDIT_CAMPAIGN_UPDATE),
    auditController.startCampaign
);

auditRouter.post(
    "/campaigns/:id/complete",
    requirePermission(PERMISSIONS.AUDIT_CAMPAIGN_UPDATE),
    auditController.completeCampaign
);

// ─── Verifications ────────────────────────────────────────────────────────────

auditRouter.get(
    "/campaigns/:id/verifications",
    requirePermission(PERMISSIONS.AUDIT_CAMPAIGN_READ),
    auditController.listVerifications
);

auditRouter.patch(
    "/campaigns/:id/verifications/:verificationId",
    requirePermission(PERMISSIONS.AUDIT_VERIFICATION_UPDATE),
    auditController.updateVerification
);