import { Router } from "express";
import { authRouter } from "./auth";
import { assetsRouter } from "./assets";
import { branchesRouter } from "./branches";
import { notificationsRouter } from "./notifications";
import { maintenanceRouter } from "./maintenance";
import { docsRouter } from "./docs";
export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/assets", assetsRouter);
apiRouter.use("/branches", branchesRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/maintenance", maintenanceRouter);
apiRouter.use("/docs", docsRouter);
