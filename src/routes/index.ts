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