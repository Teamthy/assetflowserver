import { Router } from "express";
import { env } from "../config/env";

export const debugRouter = Router();

/**
 * Test endpoint to verify Sentry integration.
 * Only available in non-production environments.
 */
debugRouter.get("/sentry-test", (_req, _res) => {
    if (env.NODE_ENV === "production") {
        return _res.status(404).json({ error: "Not found" });
    }
    throw new Error("Sentry test error — this should appear in Sentry dashboard");
});