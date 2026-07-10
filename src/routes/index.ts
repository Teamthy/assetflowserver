import { Router } from "express";
import { authRouter } from "./auth";
import { assetsRouter } from "./assets";
import { branchesRouter } from "./branches";
import { notificationsRouter } from "./notifications";
import { maintenanceRouter } from "./maintenance";
import { organizationSettingsRouter } from "./organization-settings";
import { usersRouter } from "./users";
import { reportsRouter } from "./reports";
import { invitationsRouter } from "./invitations";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/assets", assetsRouter);
apiRouter.use("/branches", branchesRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/maintenance", maintenanceRouter);
apiRouter.use("/organizations/settings", organizationSettingsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/invitations", invitationsRouter);