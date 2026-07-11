import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger";

export const docsRouter = Router();

// Swagger UI at /api/docs
docsRouter.use("/", swaggerUi.serve);
docsRouter.get(
    "/",
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "AssetFlow API Documentation",
        customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #1d4ed8; }
    `,
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: "none",
            filter: true,
            tagsSorter: "alpha",
        },
    })
);

// Raw JSON at /api/docs/json
docsRouter.get("/json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});