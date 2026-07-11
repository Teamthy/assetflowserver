import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./env";

const swaggerDefinition = {
    openapi: "3.0.3",
    info: {
        title: "AssetFlow API",
        version: "1.0.0",
        description:
            "Financial Asset Intelligence Platform — multi-tenant enterprise asset management with lifecycle tracking, depreciation, approvals, and audit workflows.",
        contact: {
            name: "AssetFlow Support",
            email: env.SUPPORT_EMAIL,
        },
        license: {
            name: "Proprietary",
        },
    },
    servers: [
        {
            url: `http://localhost:${env.PORT}/api`,
            description: "Local development server",
        },
        {
            url: "https://api.assetflow.com/api",
            description: "Production server",
        },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "JWT access token obtained from /auth/login",
            },
        },
        schemas: {
            Error: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    code: { type: "string", example: "VALIDATION_ERROR" },
                    message: { type: "string", example: "Validation failed" },
                    errors: {
                        type: "array",
                        items: { type: "object" },
                    },
                },
            },
            SuccessResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "object" },
                },
            },
            Pagination: {
                type: "object",
                properties: {
                    page: { type: "integer", example: 1 },
                    limit: { type: "integer", example: 20 },
                    total: { type: "integer", example: 150 },
                    totalPages: { type: "integer", example: 8 },
                },
            },
            User: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    email: { type: "string", format: "email" },
                },
            },
            Organization: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    slug: { type: "string" },
                },
            },
            Asset: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    organizationId: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    description: { type: "string", nullable: true },
                    assetTag: { type: "string" },
                    serialNumber: { type: "string", nullable: true },
                    category: { type: "string", nullable: true },
                    manufacturer: { type: "string", nullable: true },
                    model: { type: "string", nullable: true },
                    branchId: { type: "string", format: "uuid", nullable: true },
                    assignedTo: { type: "string", format: "uuid", nullable: true },
                    status: {
                        type: "string",
                        enum: ["active", "maintenance", "disposed"],
                    },
                    condition: {
                        type: "string",
                        enum: ["excellent", "good", "fair", "poor"],
                    },
                    purchaseCost: { type: "string", example: "250000.00" },
                    purchaseDate: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    warrantyExpiryDate: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    expectedUsefulLifeMonths: {
                        type: "integer",
                        nullable: true,
                    },
                    residualValue: { type: "string", nullable: true },
                    recognitionStatus: {
                        type: "string",
                        enum: ["recognized", "not_recognized", "pending_review"],
                    },
                    accountingTreatment: {
                        type: "string",
                        enum: [
                            "capitalized",
                            "expensed",
                            "tracked_non_capitalized",
                            "pending_review",
                        ],
                    },
                    isDepreciable: { type: "boolean" },
                    qrCodeUrl: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            Branch: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    organizationId: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    code: { type: "string", nullable: true },
                    description: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            MaintenanceTask: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    assetId: { type: "string", format: "uuid" },
                    title: { type: "string" },
                    description: { type: "string", nullable: true },
                    status: {
                        type: "string",
                        enum: ["open", "in_progress", "completed", "cancelled"],
                    },
                    priority: {
                        type: "string",
                        enum: ["low", "medium", "high", "critical"],
                    },
                    dueAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    assignedTo: {
                        type: "string",
                        format: "uuid",
                        nullable: true,
                    },
                    completedAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                },
            },
            Approval: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    assetId: { type: "string", format: "uuid" },
                    type: { type: "string", enum: ["disposal", "transfer"] },
                    status: {
                        type: "string",
                        enum: ["pending", "approved", "rejected"],
                    },
                    requestedByUserId: { type: "string", format: "uuid" },
                    approvedByUserId: {
                        type: "string",
                        format: "uuid",
                        nullable: true,
                    },
                    payload: { type: "object" },
                    expiresAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                },
            },
            Notification: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    type: { type: "string" },
                    title: { type: "string" },
                    message: { type: "string" },
                    isRead: { type: "boolean" },
                    metadata: { type: "object" },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            DepreciationSnapshot: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    assetId: { type: "string", format: "uuid" },
                    fiscalYear: { type: "integer" },
                    yearlyDepCharge: { type: "string" },
                    totalAccumulatedDepreciation: { type: "string" },
                    depreciationMethod: {
                        type: "string",
                        enum: ["straight_line", "reducing_balance"],
                    },
                    runDate: { type: "string", format: "date-time" },
                },
            },
        },
        responses: {
            Unauthorized: {
                description: "Missing or invalid authentication token",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                        example: {
                            success: false,
                            code: "AUTHENTICATION_REQUIRED",
                            message: "Missing bearer token",
                        },
                    },
                },
            },
            Forbidden: {
                description: "User does not have permission for this action",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                        example: {
                            success: false,
                            code: "PERMISSION_DENIED",
                            message: "You do not have permission to perform this action",
                        },
                    },
                },
            },
            NotFound: {
                description: "Resource not found",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
            ValidationError: {
                description: "Request validation failed",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
            Conflict: {
                description: "Resource conflict (e.g., duplicate value)",
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/Error" },
                    },
                },
            },
        },
    },
    security: [{ BearerAuth: [] }],
    tags: [
        { name: "Authentication", description: "User registration, login, and session management" },
        { name: "Assets", description: "Asset register CRUD and lifecycle operations" },
        { name: "Bulk Operations", description: "Perform actions on multiple assets at once" },
        { name: "Approvals", description: "Disposal and transfer approval workflows" },
        { name: "Depreciation", description: "Automated depreciation calculation and schedules" },
        { name: "Branches", description: "Branch and location management" },
        { name: "Maintenance", description: "Maintenance task management" },
        { name: "Notifications", description: "In-app and email notifications" },
        { name: "Users & Roles", description: "User invitation and role management" },
        { name: "Invitations", description: "User invitation flow" },
        { name: "Reports", description: "Operational dashboards" },
        { name: "Organization Settings", description: "Organization-level configuration" },
        { name: "System", description: "Health checks and diagnostics" },
    ],
};

const options: swaggerJSDoc.Options = {
    definition: swaggerDefinition,
    apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);