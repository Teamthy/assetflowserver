import {
    createDefaultSettingsForOrganization,
    findByOrganizationId,
    organizationSettingsExists,
    updateSettingsForOrganization,
} from "../repositories/organization-settings";
import { countAssetsByOrganizationId } from "../repositories/assets";
import { countBranchesByOrganizationId } from "../repositories/branches";
import {
    type OrganizationSettingsPublic,
    type OrganizationOnboardingStatus,
} from "../types/organization-settings";
import { type UpdateOrganizationSettingsInput } from "../validators/organization-settings";
import { NotFoundError } from "../utils/error";
import { logger } from "../utils/logger";


const toPublic = (row: {
    id: string;
    organizationId: string;
    capitalizationThreshold: string;
    capitalizationCurrency: string;
    minimumUsefulLifeMonths: number;
    lowValueTreatment: string;
    defaultDepreciationMethod: string;
    defaultUsefulLifeYears: number | null;
    createdAt: Date;
    updatedAt: Date;
}): OrganizationSettingsPublic => ({
    id: row.id,
    organizationId: row.organizationId,
    capitalizationThreshold: row.capitalizationThreshold,
    capitalizationCurrency: row.capitalizationCurrency,
    minimumUsefulLifeMonths: row.minimumUsefulLifeMonths,
    lowValueTreatment: row.lowValueTreatment as OrganizationSettingsPublic["lowValueTreatment"],
    defaultDepreciationMethod:
        row.defaultDepreciationMethod as OrganizationSettingsPublic["defaultDepreciationMethod"],
    defaultUsefulLifeYears: row.defaultUsefulLifeYears,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
});


export const getOrCreateOrganizationSettings = async (params: {
    organizationId: string;
    createdByUserId?: string | null;
}): Promise<OrganizationSettingsPublic> => {
    const existing = await findByOrganizationId(params.organizationId);
    if (existing) return toPublic(existing);

    logger.info("Auto-creating default organization settings (lazy init)", {
        organizationId: params.organizationId,
    });

    const created = await createDefaultSettingsForOrganization({
        organizationId: params.organizationId,
        createdByUserId: params.createdByUserId ?? null,
    });
    return toPublic(created);
};


export const createDefaultSettings = async (params: {
    organizationId: string;
    createdByUserId: string;
}): Promise<OrganizationSettingsPublic> => {
    const created = await createDefaultSettingsForOrganization({
        organizationId: params.organizationId,
        createdByUserId: params.createdByUserId,
    });
    return toPublic(created);
};

export const getOrganizationOnboardingStatus = async (
    organizationId: string,
): Promise<OrganizationOnboardingStatus> => {
    const [settingsExists, branchCount, assetCount] = await Promise.all([
        organizationSettingsExists(organizationId),
        countBranchesByOrganizationId(organizationId),
        countAssetsByOrganizationId(organizationId),
    ]);

    return {
        organizationSettingsExists: settingsExists,
        branchCount,
        assetCount,
        isSetupComplete: settingsExists && branchCount > 0 && assetCount > 0,
    };
};

export const updateOrganizationSettings = async (params: {
    organizationId: string;
    updatedByUserId: string;
    updates: UpdateOrganizationSettingsInput;
}): Promise<OrganizationSettingsPublic> => {
    await getOrCreateOrganizationSettings({
        organizationId: params.organizationId,
        createdByUserId: params.updatedByUserId,
    });

    const updated = await updateSettingsForOrganization({
        organizationId: params.organizationId,
        updatedByUserId: params.updatedByUserId,
        updates: params.updates,
    });

    if (!updated) {
        throw new NotFoundError("Organization settings");
    }

    logger.info("Organization settings updated", {
        organizationId: params.organizationId,
        updatedByUserId: params.updatedByUserId,
        fieldsUpdated: Object.keys(params.updates),
    });

    return toPublic(updated);
};


export const getRecognitionPolicy = async (organizationId: string) => {
    const settings = await getOrCreateOrganizationSettings({ organizationId });

    return {
        capitalizationThreshold: parseFloat(settings.capitalizationThreshold),
        capitalizationCurrency: settings.capitalizationCurrency,
        minimumUsefulLifeMonths: settings.minimumUsefulLifeMonths,
        lowValueTreatment: settings.lowValueTreatment,
        defaultDepreciationMethod: settings.defaultDepreciationMethod,
        defaultUsefulLifeYears: settings.defaultUsefulLifeYears,
    };
};