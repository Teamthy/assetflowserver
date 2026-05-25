import { getAssetAuditSummary } from "../repositories/assets";

export const getAssetsAuditSummary = async (
  organizationId: string,
  includeDeleted = false,
) => {
  return getAssetAuditSummary(organizationId, includeDeleted);
};
