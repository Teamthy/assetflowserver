import { z } from "zod";

export const createAuditCampaignSchema = z.object({
    name: z.string().trim().min(2).max(200),
    description: z.string().trim().max(5000).optional(),
    branchId: z.string().uuid().optional(),
    auditorUserId: z.string().uuid().optional(),
    scheduledStartDate: z.coerce.date().optional(),
    scheduledEndDate: z.coerce.date().optional(),
    notes: z.string().trim().max(5000).optional(),
});

export const updateAuditCampaignSchema = z
    .object({
        name: z.string().trim().min(2).max(200).optional(),
        description: z.string().trim().max(5000).optional(),
        branchId: z.string().uuid().nullable().optional(),
        auditorUserId: z.string().uuid().nullable().optional(),
        scheduledStartDate: z.coerce.date().nullable().optional(),
        scheduledEndDate: z.coerce.date().nullable().optional(),
        notes: z.string().trim().max(5000).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
        message: "At least one field required",
    });

export const listAuditCampaignsQuerySchema = z.object({
    status: z
        .enum(["draft", "in_progress", "completed", "cancelled"])
        .optional(),
    auditorUserId: z.string().uuid().optional(),
    branchId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const startAuditCampaignSchema = z.object({
    autoPopulateAssets: z.boolean().default(true),
});

export const updateVerificationSchema = z.object({
    status: z.enum(["found", "missing", "damaged", "moved", "unknown"]),
    findings: z.string().trim().max(5000).optional(),
    conditionAtVerification: z
        .enum(["excellent", "good", "fair", "poor"])
        .optional(),
    locationAtVerification: z.string().trim().max(500).optional(),
    remediationRequired: z.string().trim().max(2000).optional(),
});

export const completeAuditCampaignSchema = z.object({
    notes: z.string().trim().max(5000).optional(),
});

export const listVerificationsQuerySchema = z.object({
    status: z
        .enum(["pending", "found", "missing", "damaged", "moved", "unknown"])
        .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateAuditCampaignInput = z.infer<
    typeof createAuditCampaignSchema
>;
export type UpdateAuditCampaignInput = z.infer<
    typeof updateAuditCampaignSchema
>;
export type ListAuditCampaignsQuery = z.infer<
    typeof listAuditCampaignsQuerySchema
>;
export type StartAuditCampaignInput = z.infer<typeof startAuditCampaignSchema>;
export type UpdateVerificationInput = z.infer<typeof updateVerificationSchema>;
export type CompleteAuditCampaignInput = z.infer<
    typeof completeAuditCampaignSchema
>;
export type ListVerificationsQuery = z.infer<
    typeof listVerificationsQuerySchema
>;