import { eq } from "drizzle-orm";
import { db } from "../db";
import { organizationSettings } from "../model/organization-settings";
import { DEFAULT_ORGANIZATION_SETTINGS } from "../types/organization-settings";


export const findByOrganizationId = async (organizationId: string) => {
    const [settings] = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, organizationId))
        .limit(1);
    return settings ?? null;
};


export const createDefaultSettingsForOrganization = async (params: {
    organizationId: string;
    createdByUserId?: string | null;
}) => {
    const existing = await findByOrganizationId(params.organizationId);
    if (existing) return existing;

    const [inserted] = await db
        .insert(organizationSettings)
        .values({
            organizationId: params.organizationId,
            ...DEFAULT_ORGANIZATION_SETTINGS,
            createdByUserId: params.createdByUserId ?? null,
            updatedByUserId: params.createdByUserId ?? null,
        })
        .onConflictDoNothing({ target: organizationSettings.organizationId })
        .returning();

    if (!inserted) {
        const existing = await findByOrganizationId(params.organizationId);
        if (!existing) {
            throw new Error(
                `Failed to create or find organization settings for ${params.organizationId}`,
            );
        }
        return existing;
    }

    return inserted;
};


export const updateSettingsForOrganization = async (params: {
    organizationId: string;
    updatedByUserId: string;
    updates: Partial<{
        capitalizationThreshold: string;
        capitalizationCurrency: string;
        minimumUsefulLifeMonths: number;
        lowValueTreatment: "track_non_capitalized" | "expense";
        defaultDepreciationMethod: "straight_line" | "reducing_balance";
        defaultUsefulLifeYears: number | null;
    }>;
}) => {
    const [updated] = await db
        .update(organizationSettings)
        .set({
            ...params.updates,
            updatedByUserId: params.updatedByUserId,
            updatedAt: new Date(),
        })
        .where(eq(organizationSettings.organizationId, params.organizationId))
        .returning();

    return updated ?? null;
};