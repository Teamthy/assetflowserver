import { Router } from "express";
import { authRouter } from "./auth";
import { assetsRouter } from "./assets";
import { branchesRouter } from "./branches";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/assets", assetsRouter);
apiRouter.use("/branches", branchesRouter);
