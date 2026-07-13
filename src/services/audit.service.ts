import {
    bulkCreateVerifications,
    createAuditCampaign,
    findAuditCampaignById,
    findVerification,
    getCampaignVerificationStats,
    getEligibleAssetsForCampaign,
    listAuditCampaigns,
    listVerifications,
    softDeleteAuditCampaign,
    updateAuditCampaign,
    updateVerification,
} from "../repositories/audit";
import { notifyOrganizationAdmins } from "./notifications";
import { createInAppNotification } from "./notifications";
import {
    ConflictError,
    NotFoundError,
    ValidationError,
} from "../utils/error";
import { logger } from "../utils/logger";
import {
    CompleteAuditCampaignInput,
    CreateAuditCampaignInput,
    ListAuditCampaignsQuery,
    ListVerificationsQuery,
    StartAuditCampaignInput,
    UpdateAuditCampaignInput,
    UpdateVerificationInput,
} from "../validators/audit";

// ─── Create Campaign ──────────────────────────────────────────────────────────

export async function createAuditCampaignService(input: {
    organizationId: string;
    createdByUserId: string;
    payload: CreateAuditCampaignInput;
}) {
    const { organizationId, createdByUserId, payload } = input;

    const campaign = await createAuditCampaign({
        organizationId,
        ...payload,
        createdByUserId,
    });

    logger.info("[Audit] Campaign created", {
        organizationId,
        campaignId: campaign.id,
        name: campaign.name,
    });

    // Notify auditor if assigned
    if (payload.auditorUserId) {
        await createInAppNotification({
            organizationId,
            userId: payload.auditorUserId,
            type: "audit_issue",
            title: "You've been assigned to an audit campaign",
            message: `You have been assigned as auditor for campaign: ${campaign.name}`,
            metadata: {
                campaignId: campaign.id,
                redirectUrl: `/audit/campaigns/${campaign.id}`,
            },
        });
    }

    return campaign;
}

// ─── Get Campaign ─────────────────────────────────────────────────────────────

export async function getAuditCampaignService(input: {
    organizationId: string;
    campaignId: string;
}) {
    const campaign = await findAuditCampaignById(
        input.organizationId,
        input.campaignId
    );
    if (!campaign) throw new NotFoundError("Audit campaign");

    const stats = await getCampaignVerificationStats(
        input.organizationId,
        input.campaignId
    );

    return { campaign, stats };
}

// ─── List Campaigns ───────────────────────────────────────────────────────────

export async function listAuditCampaignsService(input: {
    organizationId: string;
    query: ListAuditCampaignsQuery;
}) {
    return listAuditCampaigns(input.organizationId, input.query);
}

// ─── Update Campaign ──────────────────────────────────────────────────────────

export async function updateAuditCampaignService(input: {
    organizationId: string;
    campaignId: string;
    updatedByUserId: string;
    payload: UpdateAuditCampaignInput;
}) {
    const existing = await findAuditCampaignById(
        input.organizationId,
        input.campaignId
    );
    if (!existing) throw new NotFoundError("Audit campaign");

    if (existing.status === "completed") {
        throw new ConflictError("Cannot update a completed campaign");
    }

    const updated = await updateAuditCampaign(
        input.organizationId,
        input.campaignId,
        input.updatedByUserId,
        input.payload
    );

    if (!updated) throw new NotFoundError("Audit campaign");

    logger.info("[Audit] Campaign updated", {
        organizationId: input.organizationId,
        campaignId: input.campaignId,
    });

    return updated;
}

// ─── Delete Campaign ──────────────────────────────────────────────────────────

export async function deleteAuditCampaignService(input: {
    organizationId: string;
    campaignId: string;
    updatedByUserId: string;
}) {
    const existing = await findAuditCampaignById(
        input.organizationId,
        input.campaignId
    );
    if (!existing) throw new NotFoundError("Audit campaign");

    if (existing.status === "in_progress") {
        throw new ConflictError("Cannot delete an in-progress campaign");
    }

    await softDeleteAuditCampaign(
        input.organizationId,
        input.campaignId,
        input.updatedByUserId
    );

    logger.info("[Audit] Campaign deleted", {
        organizationId: input.organizationId,
        campaignId: input.campaignId,
    });

    return { message: "Audit campaign deleted" };
}

// ─── Start Campaign ───────────────────────────────────────────────────────────

export async function startAuditCampaignService(input: {
    organizationId: string;
    campaignId: string;
    updatedByUserId: string;
    payload: StartAuditCampaignInput;
}) {
    const campaign = await findAuditCampaignById(
        input.organizationId,
        input.campaignId
    );
    if (!campaign) throw new NotFoundError("Audit campaign");

    if (campaign.status !== "draft") {
        throw new ConflictError(
            `Campaign cannot be started from status: ${campaign.status}`
        );
    }

    // Get eligible assets
    const eligibleAssets = await getEligibleAssetsForCampaign(
        input.organizationId,
        campaign.branchId ?? undefined
    );

    if (eligibleAssets.length === 0) {
        throw new ValidationError("Validation failed", [
            {
                path: ["branchId"],
                message: "No eligible assets found for this campaign scope",
            },
        ]);
    }

    // Populate verifications
    if (input.payload.autoPopulateAssets) {
        await bulkCreateVerifications(
            input.organizationId,
            input.campaignId,
            eligibleAssets.map((a) => a.id)
        );
    }

    // Update campaign to in_progress
    const started = await updateAuditCampaign(
        input.organizationId,
        input.campaignId,
        input.updatedByUserId,
        {
            status: "in_progress",
            startedAt: new Date(),
            totalAssetsExpected: String(eligibleAssets.length),
        }
    );

    logger.info("[Audit] Campaign started", {
        organizationId: input.organizationId,
        campaignId: input.campaignId,
        eligibleAssets: eligibleAssets.length,
    });

    // Notify auditor + admins
    await notifyOrganizationAdmins({
        organizationId: input.organizationId,
        type: "audit_issue",
        title: "Audit campaign started",
        message: `Campaign "${campaign.name}" has started with ${eligibleAssets.length} assets to verify.`,
        metadata: {
            campaignId: input.campaignId,
            redirectUrl: `/audit/campaigns/${input.campaignId}`,
        },
    });

    return started;
}

// ─── Complete Campaign ────────────────────────────────────────────────────────

export async function completeAuditCampaignService(input: {
    organizationId: string;
    campaignId: string;
    updatedByUserId: string;
    payload: CompleteAuditCampaignInput;
}) {
    const campaign = await findAuditCampaignById(
        input.organizationId,
        input.campaignId
    );
    if (!campaign) throw new NotFoundError("Audit campaign");

    if (campaign.status !== "in_progress") {
        throw new ConflictError(
            `Only in-progress campaigns can be completed. Current: ${campaign.status}`
        );
    }

    // Get final stats
    const stats = await getCampaignVerificationStats(
        input.organizationId,
        input.campaignId
    );

    const completed = await updateAuditCampaign(
        input.organizationId,
        input.campaignId,
        input.updatedByUserId,
        {
            status: "completed",
            completedAt: new Date(),
            totalVerified: String(stats.found + stats.damaged + stats.moved),
            totalMissing: String(stats.missing),
            totalDamaged: String(stats.damaged),
            notes: input.payload.notes ?? campaign.notes,
        }
    );

    logger.info("[Audit] Campaign completed", {
        organizationId: input.organizationId,
        campaignId: input.campaignId,
        stats,
    });

    await notifyOrganizationAdmins({
        organizationId: input.organizationId,
        type: "audit_issue",
        title: "Audit campaign completed",
        message: `Campaign "${campaign.name}" completed. ${stats.found} found, ${stats.missing} missing, ${stats.damaged} damaged.`,
        metadata: {
            campaignId: input.campaignId,
            stats,
            redirectUrl: `/audit/campaigns/${input.campaignId}`,
        },
    });

    return { campaign: completed, stats };
}

// ─── List Verifications ───────────────────────────────────────────────────────

export async function listVerificationsService(input: {
    organizationId: string;
    campaignId: string;
    query: ListVerificationsQuery;
}) {
    const campaign = await findAuditCampaignById(
        input.organizationId,
        input.campaignId
    );
    if (!campaign) throw new NotFoundError("Audit campaign");

    return listVerifications(input.organizationId, input.campaignId, input.query);
}

// ─── Update Verification ──────────────────────────────────────────────────────

export async function updateVerificationService(input: {
    organizationId: string;
    campaignId: string;
    verificationId: string;
    verifiedByUserId: string;
    payload: UpdateVerificationInput;
}) {
    const campaign = await findAuditCampaignById(
        input.organizationId,
        input.campaignId
    );
    if (!campaign) throw new NotFoundError("Audit campaign");

    if (campaign.status !== "in_progress") {
        throw new ConflictError(
            "Can only verify assets in an in-progress campaign"
        );
    }

    const updated = await updateVerification({
        organizationId: input.organizationId,
        campaignId: input.campaignId,
        verificationId: input.verificationId,
        verifiedByUserId: input.verifiedByUserId,
        status: input.payload.status,
        findings: input.payload.findings,
        conditionAtVerification: input.payload.conditionAtVerification,
        locationAtVerification: input.payload.locationAtVerification,
        remediationRequired: input.payload.remediationRequired,
    });

    if (!updated) throw new NotFoundError("Verification");

    logger.info("[Audit] Verification updated", {
        organizationId: input.organizationId,
        campaignId: input.campaignId,
        verificationId: input.verificationId,
        status: input.payload.status,
    });

    // Alert admins if asset is missing or damaged
    if (input.payload.status === "missing" || input.payload.status === "damaged") {
        await notifyOrganizationAdmins({
            organizationId: input.organizationId,
            type: "audit_issue",
            title: `Asset ${input.payload.status} during audit`,
            message: `An asset was reported as ${input.payload.status} during audit "${campaign.name}"`,
            metadata: {
                campaignId: input.campaignId,
                verificationId: input.verificationId,
                status: input.payload.status,
                redirectUrl: `/audit/campaigns/${input.campaignId}/verifications/${input.verificationId}`,
            },
        });
    }

    return updated;
}