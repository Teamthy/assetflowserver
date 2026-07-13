import { and, count, desc, eq, inArray, isNull, SQL } from "drizzle-orm";
import { db } from "../db";
import { auditCampaigns, auditVerifications } from "../model/audit";
import { assets } from "../model/asset";
import { users } from "../model/user";
import { branches } from "../model/branch";

// ─── Create Campaign ──────────────────────────────────────────────────────────

export async function createAuditCampaign(input: {
    organizationId: string;
    name: string;
    description?: string;
    branchId?: string;
    auditorUserId?: string;
    scheduledStartDate?: Date;
    scheduledEndDate?: Date;
    notes?: string;
    createdByUserId: string;
}): Promise<typeof auditCampaigns.$inferSelect> {
    const [record] = await db
        .insert(auditCampaigns)
        .values({
            organizationId: input.organizationId,
            name: input.name,
            description: input.description ?? null,
            branchId: input.branchId ?? null,
            auditorUserId: input.auditorUserId ?? null,
            scheduledStartDate: input.scheduledStartDate ?? null,
            scheduledEndDate: input.scheduledEndDate ?? null,
            notes: input.notes ?? null,
            createdByUserId: input.createdByUserId,
            updatedByUserId: input.createdByUserId,
        })
        .returning();

    return record;
}

// ─── Find Campaign ────────────────────────────────────────────────────────────

export async function findAuditCampaignById(
    organizationId: string,
    campaignId: string
): Promise<typeof auditCampaigns.$inferSelect | null> {
    const [record] = await db
        .select()
        .from(auditCampaigns)
        .where(
            and(
                eq(auditCampaigns.organizationId, organizationId),
                eq(auditCampaigns.id, campaignId),
                isNull(auditCampaigns.deletedAt)
            )
        )
        .limit(1);

    return record ?? null;
}

// ─── List Campaigns ───────────────────────────────────────────────────────────

export async function listAuditCampaigns(
    organizationId: string,
    query: {
        status?: "draft" | "in_progress" | "completed" | "cancelled";
        auditorUserId?: string;
        branchId?: string;
        page: number;
        limit: number;
    }
) {
    const filters: SQL[] = [
        eq(auditCampaigns.organizationId, organizationId),
        isNull(auditCampaigns.deletedAt),
    ];

    if (query.status) filters.push(eq(auditCampaigns.status, query.status));
    if (query.auditorUserId)
        filters.push(eq(auditCampaigns.auditorUserId, query.auditorUserId));
    if (query.branchId) filters.push(eq(auditCampaigns.branchId, query.branchId));

    const whereClause = and(...filters);
    const offset = (query.page - 1) * query.limit;

    const [totalRow] = await db
        .select({ total: count() })
        .from(auditCampaigns)
        .where(whereClause);

    const rows = await db
        .select({
            id: auditCampaigns.id,
            name: auditCampaigns.name,
            description: auditCampaigns.description,
            status: auditCampaigns.status,
            branchId: auditCampaigns.branchId,
            branchName: branches.name,
            auditorUserId: auditCampaigns.auditorUserId,
            auditorFirstName: users.firstName,
            auditorLastName: users.lastName,
            scheduledStartDate: auditCampaigns.scheduledStartDate,
            scheduledEndDate: auditCampaigns.scheduledEndDate,
            startedAt: auditCampaigns.startedAt,
            completedAt: auditCampaigns.completedAt,
            totalAssetsExpected: auditCampaigns.totalAssetsExpected,
            totalVerified: auditCampaigns.totalVerified,
            totalMissing: auditCampaigns.totalMissing,
            totalDamaged: auditCampaigns.totalDamaged,
            createdAt: auditCampaigns.createdAt,
        })
        .from(auditCampaigns)
        .leftJoin(branches, eq(auditCampaigns.branchId, branches.id))
        .leftJoin(users, eq(auditCampaigns.auditorUserId, users.id))
        .where(whereClause)
        .orderBy(desc(auditCampaigns.createdAt))
        .limit(query.limit)
        .offset(offset);

    const total = Number(totalRow?.total ?? 0);

    return {
        data: rows,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / query.limit)),
        },
    };
}

// ─── Update Campaign ──────────────────────────────────────────────────────────

export async function updateAuditCampaign(
    organizationId: string,
    campaignId: string,
    updatedByUserId: string,
    payload: Partial<typeof auditCampaigns.$inferInsert>
): Promise<typeof auditCampaigns.$inferSelect | null> {
    const [record] = await db
        .update(auditCampaigns)
        .set({
            ...payload,
            updatedByUserId,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(auditCampaigns.organizationId, organizationId),
                eq(auditCampaigns.id, campaignId),
                isNull(auditCampaigns.deletedAt)
            )
        )
        .returning();

    return record ?? null;
}

// ─── Delete Campaign ──────────────────────────────────────────────────────────

export async function softDeleteAuditCampaign(
    organizationId: string,
    campaignId: string,
    updatedByUserId: string
): Promise<typeof auditCampaigns.$inferSelect | null> {
    const [record] = await db
        .update(auditCampaigns)
        .set({
            deletedAt: new Date(),
            updatedAt: new Date(),
            updatedByUserId,
        })
        .where(
            and(
                eq(auditCampaigns.organizationId, organizationId),
                eq(auditCampaigns.id, campaignId),
                isNull(auditCampaigns.deletedAt)
            )
        )
        .returning();

    return record ?? null;
}

// ─── Get Eligible Assets for Campaign ─────────────────────────────────────────

export async function getEligibleAssetsForCampaign(
    organizationId: string,
    branchId?: string
) {
    const filters: SQL[] = [
        eq(assets.organizationId, organizationId),
        isNull(assets.deletedAt),
    ];

    if (branchId) filters.push(eq(assets.branchId, branchId));

    return db
        .select({
            id: assets.id,
            name: assets.name,
            assetTag: assets.assetTag,
            status: assets.status,
        })
        .from(assets)
        .where(and(...filters));
}

// ─── Bulk Create Verifications ────────────────────────────────────────────────

export async function bulkCreateVerifications(
    organizationId: string,
    campaignId: string,
    assetIds: string[]
): Promise<number> {
    if (assetIds.length === 0) return 0;

    await db.insert(auditVerifications).values(
        assetIds.map((assetId) => ({
            organizationId,
            campaignId,
            assetId,
            status: "pending" as const,
        }))
    );

    return assetIds.length;
}

// ─── Find Verification ────────────────────────────────────────────────────────

export async function findVerification(
    organizationId: string,
    campaignId: string,
    assetId: string
): Promise<typeof auditVerifications.$inferSelect | null> {
    const [record] = await db
        .select()
        .from(auditVerifications)
        .where(
            and(
                eq(auditVerifications.organizationId, organizationId),
                eq(auditVerifications.campaignId, campaignId),
                eq(auditVerifications.assetId, assetId)
            )
        )
        .limit(1);

    return record ?? null;
}

// ─── List Verifications ───────────────────────────────────────────────────────

export async function listVerifications(
    organizationId: string,
    campaignId: string,
    query: {
        status?: "pending" | "found" | "missing" | "damaged" | "moved" | "unknown";
        page: number;
        limit: number;
    }
) {
    const filters: SQL[] = [
        eq(auditVerifications.organizationId, organizationId),
        eq(auditVerifications.campaignId, campaignId),
    ];

    if (query.status) {
        filters.push(eq(auditVerifications.status, query.status));
    }

    const whereClause = and(...filters);
    const offset = (query.page - 1) * query.limit;

    const [totalRow] = await db
        .select({ total: count() })
        .from(auditVerifications)
        .where(whereClause);

    const rows = await db
        .select({
            id: auditVerifications.id,
            assetId: auditVerifications.assetId,
            assetName: assets.name,
            assetTag: assets.assetTag,
            status: auditVerifications.status,
            verifiedByUserId: auditVerifications.verifiedByUserId,
            verifiedAt: auditVerifications.verifiedAt,
            findings: auditVerifications.findings,
            conditionAtVerification: auditVerifications.conditionAtVerification,
            locationAtVerification: auditVerifications.locationAtVerification,
            remediationRequired: auditVerifications.remediationRequired,
            remediationCompletedAt: auditVerifications.remediationCompletedAt,
            createdAt: auditVerifications.createdAt,
        })
        .from(auditVerifications)
        .innerJoin(assets, eq(auditVerifications.assetId, assets.id))
        .where(whereClause)
        .orderBy(desc(auditVerifications.createdAt))
        .limit(query.limit)
        .offset(offset);

    const total = Number(totalRow?.total ?? 0);

    return {
        data: rows,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / query.limit)),
        },
    };
}

// ─── Update Verification ──────────────────────────────────────────────────────

export async function updateVerification(input: {
    organizationId: string;
    campaignId: string;
    verificationId: string;
    verifiedByUserId: string;
    status: "found" | "missing" | "damaged" | "moved" | "unknown";
    findings?: string;
    conditionAtVerification?: string;
    locationAtVerification?: string;
    remediationRequired?: string;
}): Promise<typeof auditVerifications.$inferSelect | null> {
    const [record] = await db
        .update(auditVerifications)
        .set({
            status: input.status,
            verifiedByUserId: input.verifiedByUserId,
            verifiedAt: new Date(),
            findings: input.findings ?? null,
            conditionAtVerification: input.conditionAtVerification ?? null,
            locationAtVerification: input.locationAtVerification ?? null,
            remediationRequired: input.remediationRequired ?? null,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(auditVerifications.organizationId, input.organizationId),
                eq(auditVerifications.campaignId, input.campaignId),
                eq(auditVerifications.id, input.verificationId)
            )
        )
        .returning();

    return record ?? null;
}

// ─── Get Campaign Verification Stats ──────────────────────────────────────────

export async function getCampaignVerificationStats(
    organizationId: string,
    campaignId: string
) {
    const rows = await db
        .select({
            status: auditVerifications.status,
            count: count(),
        })
        .from(auditVerifications)
        .where(
            and(
                eq(auditVerifications.organizationId, organizationId),
                eq(auditVerifications.campaignId, campaignId)
            )
        )
        .groupBy(auditVerifications.status);

    const statusMap = Object.fromEntries(
        rows.map((r) => [r.status, Number(r.count)])
    );

    return {
        total: rows.reduce((acc, r) => acc + Number(r.count), 0),
        pending: statusMap["pending"] ?? 0,
        found: statusMap["found"] ?? 0,
        missing: statusMap["missing"] ?? 0,
        damaged: statusMap["damaged"] ?? 0,
        moved: statusMap["moved"] ?? 0,
        unknown: statusMap["unknown"] ?? 0,
    };
}