import { Router } from "express";
import { authRouter } from "./auth";
import { assetsRouter } from "./assets.routes";
import { branchesRouter } from "./branches.routes";
import { maintenanceRouter } from "./maintenance.routes";
import { notificationsRouter } from "./notifications";
import { auditRouter } from "./audit";
import { reportsRouter } from "./reports";
import { documentsRouter } from "./documents";
import { approvalsRouter } from "./approvals";
import { usersRouter } from "./users";
import { invitationsRouter } from "./invitations";
import { organizationSettingsRouter } from "./organization-settings";
import { depreciationRouter } from "./depreciation";
import { bulkRouter } from "./bulk";
import { docsRouter } from "./docs";
import * as notificationPreferencesController from "../controllers/notification-preferences";
import { requireAuth } from "../middlewares/auth";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/assets", assetsRouter);
apiRouter.use("/branches", branchesRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/maintenance", maintenanceRouter);
apiRouter.use("/audit", auditRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/documents", documentsRouter);
apiRouter.use("/approvals", approvalsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/invitations", invitationsRouter);
apiRouter.use("/organization-settings", organizationSettingsRouter);
apiRouter.use("/depreciation", depreciationRouter);
apiRouter.use("/bulk", bulkRouter);
apiRouter.use("/docs", docsRouter);
apiRouter.get(
    "/notification-preferences",
    requireAuth,
    notificationPreferencesController.getNotificationPreferences,
);
apiRouter.patch(
    "/notification-preferences",
    requireAuth,
    notificationPreferencesController.updateNotificationPreferences,
);