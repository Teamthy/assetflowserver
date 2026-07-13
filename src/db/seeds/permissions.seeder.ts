// UPDATE 1 — In buildPermissionDescription(), add the new keys:

function buildPermissionDescription(key: PermissionKey): string {
    const descriptions: Record<PermissionKey, string> = {
        // ... existing descriptions ...

        // ADD THESE:
        "asset:dispose:approve": "Approve disposal requests above the threshold",
        "depreciation:edit": "Edit an existing depreciation snapshot",
        "depreciation:delete": "Delete a depreciation record",
        "depreciation:run_bulk": "Run bulk depreciation across all eligible assets",
        "branch:force_delete": "Force delete a branch that has active assets",
        "notification:announce": "Send a system-wide announcement to all users",
        "org:ownership:transfer": "Transfer organization ownership to another user",
        "org:delete": "Permanently delete the organization",
        "user:remove": "Remove a user from the organization",
        "report:view": "Access reporting dashboards and analytics",
        "document:upload": "Upload documents and evidence to records",
        "document:delete": "Delete uploaded documents",
        "insurance:read": "View insurance records for assets",
        "insurance:write": "Add or edit insurance records",
        "insurance:delete": "Delete insurance records",
        "revaluation:read": "View revaluation records",
        "revaluation:write": "Create or edit revaluation records",
        "revaluation:delete": "Delete revaluation records",
    };

    return descriptions[key] ?? key;
}

// UPDATE 2 — buildRoleDescription() already covers all 7 roles.
// No changes needed there.