// ─────────────────────────────────────────────────────────────────────────────
// TEST APP FACTORY
// Creates a clean Express instance for E2E tests
// Does NOT start a server — supertest handles that
// Does NOT run seeder or scheduler on startup
// ─────────────────────────────────────────────────────────────────────────────

import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "../../../middlewares/error";
import { apiRouter } from "../../../routes";

export function createTestApp() {
    const app = express();

    app.use(helmet());
    app.use(cors());
    app.use(express.json());

    app.use("/api", apiRouter);
    app.use(errorHandler);

    return app;
}