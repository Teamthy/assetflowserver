import express from "express";
import { errorHandler } from "../../../middlewares/error";
import { apiRouter } from "../../../routes";

export function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use("/api", apiRouter);
    app.use(errorHandler);
    return app;
}