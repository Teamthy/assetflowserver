// ─────────────────────────────────────────────────────────────────────────────
// EXPRESS REQUEST AUGMENTATION
// Corrected for actual schema and JWT payload structure
// ─────────────────────────────────────────────────────────────────────────────

declare namespace Express {
  interface Request {
    auth?: {
      userId: string;
      organizationId: string;
      email?: string;
      // Present in JWT for Branch Manager role
      // Added at login time when user has branch_manager role
      branchId?: string;
      // Injected by requireBranchScope — controllers read this
      scopedBranchId?: string;
      // Injected by requireOwnAsset / requireOwnTask — controllers read this
      scopedUserId?: string;
    };
  }
}