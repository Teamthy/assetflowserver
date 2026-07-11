/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     security: []
 *     responses:
 *       200:
 *         description: Server is running
 *
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register new user with personal or organization workspace
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountType, firstName, lastName, email, password]
 *             properties:
 *               accountType:
 *                 type: string
 *                 enum: [personal, organization]
 *               organizationName:
 *                 type: string
 *                 description: Required if accountType is organization
 *               organizationSlug:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *                     organization: { $ref: '#/components/schemas/Organization' }
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /auth/organization-login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login for users with multiple organization memberships
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationSlug, email, password]
 *             properties:
 *               organizationSlug: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string }
 *
 * /auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token using refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout current session
 *     responses:
 *       200:
 *         description: Logged out successfully
 *
 * /auth/logout-all:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout all sessions across all organizations
 *
 * /auth/change-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Change password for authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *
 * /auth/password-reset/request:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset OTP
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *
 * /auth/password-reset/confirm:
 *   post:
 *     tags: [Authentication]
 *     summary: Confirm password reset with OTP
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *
 * /auth/verify-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify current user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string }
 *
 * /assets:
 *   get:
 *     tags: [Assets]
 *     summary: List assets with pagination, filtering, and sorting
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 200 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [active, maintenance, disposed] } }
 *       - { in: query, name: branchId, schema: { type: string, format: uuid } }
 *       - { in: query, name: assignedTo, schema: { type: string, format: uuid } }
 *       - { in: query, name: purchasedFrom, schema: { type: string, format: date } }
 *       - { in: query, name: purchasedTo, schema: { type: string, format: date } }
 *       - { in: query, name: sortBy, schema: { type: string, enum: [name, purchaseDate, createdAt, status, assetTag] } }
 *       - { in: query, name: sortOrder, schema: { type: string, enum: [asc, desc] } }
 *       - { in: query, name: includeDeleted, schema: { type: boolean } }
 *     responses:
 *       200:
 *         description: Paginated list of assets
 *   post:
 *     tags: [Assets]
 *     summary: Create a new asset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, assetTag, purchaseCost]
 *             properties:
 *               name: { type: string }
 *               assetTag: { type: string }
 *               serialNumber: { type: string }
 *               purchaseCost: { type: number }
 *               purchaseDate: { type: string, format: date }
 *               branchId: { type: string, format: uuid }
 *               assignedTo: { type: string, format: uuid }
 *               expectedUsefulLifeMonths: { type: integer }
 *               residualValue: { type: number }
 *               hasFutureEconomicBenefit: { type: boolean }
 *               costCanBeReliablyMeasured: { type: boolean }
 *     responses:
 *       201:
 *         description: Asset created
 *
 * /assets/{id}:
 *   get:
 *     tags: [Assets]
 *     summary: Get asset by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *   patch:
 *     tags: [Assets]
 *     summary: Update asset
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *   delete:
 *     tags: [Assets]
 *     summary: Soft-delete asset
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *
 * /assets/{id}/transfer:
 *   post:
 *     tags: [Assets]
 *     summary: Transfer asset to another branch or user
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               toBranchId: { type: string, format: uuid }
 *               toUserId: { type: string, format: uuid }
 *               reason: { type: string }
 *
 * /assets/{id}/dispose:
 *   post:
 *     tags: [Assets]
 *     summary: Dispose of an asset
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [method, reason]
 *             properties:
 *               method: { type: string, enum: [sold, donated, scrapped, lost, written_off, other] }
 *               reason: { type: string }
 *               proceeds: { type: number }
 *               disposedAt: { type: string, format: date-time }
 *               notes: { type: string }
 *
 * /assets/{id}/restore:
 *   post:
 *     tags: [Assets]
 *     summary: Restore deleted or disposed asset
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *
 * /assets/{id}/depreciation:
 *   post:
 *     tags: [Assets]
 *     summary: Manually record depreciation snapshot for asset
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *
 * /assets/{id}/timeline:
 *   get:
 *     tags: [Assets]
 *     summary: Get complete lifecycle timeline for asset
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *
 * /assets/{id}/qr:
 *   get:
 *     tags: [Assets]
 *     summary: Generate QR code for asset
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *
 * /assets/{id}/scan:
 *   get:
 *     tags: [Assets]
 *     summary: Scan-to-lookup asset by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *
 * /assets/qr/bulk:
 *   post:
 *     tags: [Assets]
 *     summary: Bulk generate QR codes for up to 100 assets
 *
 * /assets/audit:
 *   get:
 *     tags: [Assets]
 *     summary: Get asset audit summary with missing field counts
 *
 * /assets/import:
 *   post:
 *     tags: [Assets]
 *     summary: Import assets from Excel file
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *
 * /assets/import/template:
 *   get:
 *     tags: [Assets]
 *     summary: Download Excel import template with instructions
 *
 * /assets/export:
 *   get:
 *     tags: [Assets]
 *     summary: Export assets to Excel (respects filter query params)
 *
 * /bulk/assets/delete:
 *   post:
 *     tags: [Bulk Operations]
 *     summary: Bulk soft-delete up to 100 assets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assetIds]
 *             properties:
 *               assetIds:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *                 maxItems: 100
 *               reason: { type: string }
 *
 * /bulk/assets/transfer:
 *   post:
 *     tags: [Bulk Operations]
 *     summary: Bulk transfer assets to branch or user
 *
 * /bulk/assets/status:
 *   post:
 *     tags: [Bulk Operations]
 *     summary: Bulk update asset status
 *
 * /approvals:
 *   get:
 *     tags: [Approvals]
 *     summary: List all pending approvals for organization
 *     parameters:
 *       - { in: query, name: type, schema: { type: string, enum: [disposal, transfer] } }
 *
 * /approvals/assets/{assetId}/disposal:
 *   post:
 *     tags: [Approvals]
 *     summary: Request disposal approval
 *     parameters:
 *       - { in: path, name: assetId, required: true, schema: { type: string, format: uuid } }
 *
 * /approvals/assets/{assetId}/transfer:
 *   post:
 *     tags: [Approvals]
 *     summary: Request transfer approval
 *     parameters:
 *       - { in: path, name: assetId, required: true, schema: { type: string, format: uuid } }
 *
 * /approvals/{approvalId}/disposal/decision:
 *   patch:
 *     tags: [Approvals]
 *     summary: Approve or reject disposal request
 *     parameters:
 *       - { in: path, name: approvalId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approved]
 *             properties:
 *               approved: { type: boolean }
 *               notes: { type: string }
 *
 * /approvals/{approvalId}/transfer/decision:
 *   patch:
 *     tags: [Approvals]
 *     summary: Approve or reject transfer request
 *     parameters:
 *       - { in: path, name: approvalId, required: true, schema: { type: string, format: uuid } }
 *
 * /approvals/assets/{assetId}:
 *   get:
 *     tags: [Approvals]
 *     summary: List all approvals for a specific asset
 *     parameters:
 *       - { in: path, name: assetId, required: true, schema: { type: string, format: uuid } }
 *
 * /depreciation/run:
 *   post:
 *     tags: [Depreciation]
 *     summary: Run batch depreciation for a fiscal year
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fiscalYear]
 *             properties:
 *               fiscalYear: { type: integer }
 *               method: { type: string, enum: [straight_line, reducing_balance] }
 *               dryRun: { type: boolean }
 *               assetIds:
 *                 type: array
 *                 items: { type: string, format: uuid }
 *
 * /depreciation/preview/{assetId}:
 *   get:
 *     tags: [Depreciation]
 *     summary: Preview depreciation calculation without persisting
 *     parameters:
 *       - { in: path, name: assetId, required: true, schema: { type: string, format: uuid } }
 *       - { in: query, name: fiscalYear, required: true, schema: { type: integer } }
 *       - { in: query, name: method, schema: { type: string, enum: [straight_line, reducing_balance] } }
 *
 * /depreciation/schedule:
 *   get:
 *     tags: [Depreciation]
 *     summary: Get paginated depreciation schedule
 *     parameters:
 *       - { in: query, name: fiscalYear, schema: { type: integer } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *
 * /branches:
 *   get:
 *     tags: [Branches]
 *     summary: List branches
 *   post:
 *     tags: [Branches]
 *     summary: Create branch
 *
 * /branches/{id}:
 *   get:
 *     tags: [Branches]
 *     summary: Get branch by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *   patch:
 *     tags: [Branches]
 *     summary: Update branch
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *   delete:
 *     tags: [Branches]
 *     summary: Soft-delete branch (fails if active assets exist)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *
 * /maintenance:
 *   get:
 *     tags: [Maintenance]
 *     summary: List maintenance tasks
 *   post:
 *     tags: [Maintenance]
 *     summary: Create maintenance task
 *
 * /maintenance/{id}:
 *   get:
 *     tags: [Maintenance]
 *     summary: Get maintenance task by ID
 *   patch:
 *     tags: [Maintenance]
 *     summary: Update maintenance task
 *
 * /maintenance/{id}/complete:
 *   patch:
 *     tags: [Maintenance]
 *     summary: Complete a maintenance task
 *
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications for authenticated user
 *     parameters:
 *       - { in: query, name: unreadOnly, schema: { type: boolean } }
 *
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *
 * /users:
 *   get:
 *     tags: [Users & Roles]
 *     summary: List all users in organization
 *
 * /users/roles:
 *   get:
 *     tags: [Users & Roles]
 *     summary: List all roles in organization
 *
 * /users/{userId}/roles:
 *   get:
 *     tags: [Users & Roles]
 *     summary: Get roles assigned to user
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string, format: uuid } }
 *   post:
 *     tags: [Users & Roles]
 *     summary: Assign role to user
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string, format: uuid } }
 *
 * /users/{userId}/roles/{roleId}:
 *   delete:
 *     tags: [Users & Roles]
 *     summary: Remove role from user
 *
 * /invitations:
 *   get:
 *     tags: [Invitations]
 *     summary: List pending invitations
 *   post:
 *     tags: [Invitations]
 *     summary: Invite a new user
 *
 * /invitations/{userId}:
 *   delete:
 *     tags: [Invitations]
 *     summary: Cancel pending invitation
 *     parameters:
 *       - { in: path, name: userId, required: true, schema: { type: string, format: uuid } }
 *
 * /invitations/preview/{token}:
 *   get:
 *     tags: [Invitations]
 *     summary: Preview invitation details before accepting
 *     security: []
 *
 * /invitations/accept:
 *   post:
 *     tags: [Invitations]
 *     summary: Accept invitation and set password
 *     security: []
 *
 * /reports/assets:
 *   get:
 *     tags: [Reports]
 *     summary: Asset dashboard (counts by status, condition, category, branch)
 *
 * /reports/finance:
 *   get:
 *     tags: [Reports]
 *     summary: Finance dashboard (accounting treatment, depreciation, disposals)
 *
 * /reports/maintenance:
 *   get:
 *     tags: [Reports]
 *     summary: Maintenance dashboard (open, overdue, upcoming, by priority)
 *
 * /reports/audit:
 *   get:
 *     tags: [Reports]
 *     summary: Audit dashboard (field completeness, risk indicators)
 *
 * /organizations/settings:
 *   get:
 *     tags: [Organization Settings]
 *     summary: Get organization settings
 *   patch:
 *     tags: [Organization Settings]
 *     summary: Update organization settings
 */

export { };