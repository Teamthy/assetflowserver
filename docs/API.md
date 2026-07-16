# API Reference

Base path: `/api`

Most endpoints return JSON in this shape:

```json
{
  "success": true,
  "data": {}
}
```

Protected endpoints require a bearer access token:

```http
Authorization: Bearer <access-token>
```

Permission-protected endpoints require the relevant permission key. Organization owners and users with the `admin` role pass permission checks directly.

## Health

### `GET /api/health`

Returns service health.

## Auth

### `POST /api/auth/register`

Registers a personal or organization account.

Personal body:

```json
{
  "accountType": "personal",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@example.com",
  "password": "strong-password",
  "organizationName": "Optional Org",
  "organizationSlug": "optional-org"
}
```

Organization body:

```json
{
  "accountType": "organization",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@example.com",
  "password": "strong-password",
  "organizationName": "Acme Assets",
  "organizationSlug": "acme-assets"
}
```

### `POST /api/auth/login`

```json
{
  "email": "ada@example.com",
  "password": "strong-password"
}
```

### `POST /api/auth/organization-login`

```json
{
  "organizationSlug": "acme-assets",
  "email": "ada@example.com",
  "password": "strong-password"
}
```

### `POST /api/auth/verify-password`

Protected.

```json
{
  "password": "strong-password"
}
```

### `POST /api/auth/password-reset/request`

Alias: `POST /api/auth/forgot-password`

```json
{
  "email": "ada@example.com"
}
```

### `POST /api/auth/password-reset/confirm`

Alias: `POST /api/auth/reset-password`

```json
{
  "email": "ada@example.com",
  "token": "123456",
  "newPassword": "new-strong-password"
}
```

### `POST /api/auth/refresh-token`

Alias: `POST /api/auth/refresh`

```json
{
  "refreshToken": "optional-refresh-token-when-not-using-cookie"
}
```

### `POST /api/auth/logout`

Protected.

### `POST /api/auth/logout-all`

Protected.

### `POST /api/auth/change-password`

Protected.

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-strong-password"
}
```

## Assets

All asset endpoints are protected.

### `GET /api/assets`

Requires `assets.read`.

Query parameters:

- `page`
- `limit`
- `search`
- `status`: `active`, `maintenance`, `disposed`
- `branchId`
- `assignedTo`
- `purchasedFrom`
- `purchasedTo`
- `sortBy`: `name`, `purchaseDate`, `createdAt`, `status`, `assetTag`
- `sortOrder`: `asc`, `desc`
- `includeDeleted`

### `POST /api/assets`

Requires `assets.write`.

```json
{
  "name": "MacBook Pro",
  "assetTag": "AST-001",
  "purchaseCost": 750000,
  "expectedUsefulLifeMonths": 36,
  "hasFutureEconomicBenefit": true,
  "costCanBeReliablyMeasured": true,
  "status": "active",
  "condition": "good"
}
```

Optional fields include description, serial number, category, manufacturer, model, branchId, assignedTo, purchaseDate, warrantyExpiryDate, residualValue, qrCodeUrl, and isDepreciable.

### `GET /api/assets/:id`

Requires `assets.read`.

### `PATCH /api/assets/:id`

Requires `assets.write`. Accepts partial asset fields. Use the disposal endpoint to dispose an asset.

### `DELETE /api/assets/:id`

Requires `assets.write`. Soft-deletes the asset.

### `POST /api/assets/:id/restore`

Requires `assets.write`.

```json
{
  "reason": "Deleted by mistake",
  "status": "active"
}
```

### `POST /api/assets/:id/transfer`

Requires `assets.write`.

```json
{
  "toBranchId": "uuid",
  "toUserId": "uuid",
  "reason": "Moved to operations team"
}
```

At least one of `toBranchId` or `toUserId` is required.

### `POST /api/assets/:id/dispose`

Requires `assets.write`.

```json
{
  "method": "sold",
  "reason": "Replaced with newer unit",
  "proceeds": 50000,
  "disposedAt": "2026-07-10T00:00:00.000Z",
  "approvedByUserId": "uuid",
  "notes": "Optional notes"
}
```

Methods: `sold`, `donated`, `scrapped`, `lost`, `written_off`, `other`.

### `POST /api/assets/:id/depreciation`

Requires `assets.write`.

Records a depreciation snapshot. The API validates the arithmetic but does not calculate depreciation automatically.

```json
{
  "fiscalYear": 2026,
  "periodUsedPriorYears": 12,
  "periodUsedCurrentYear": 12,
  "accumulatedDepreciationBf": 100000,
  "yearlyDepCharge": 50000,
  "totalAccumulatedDepreciation": 150000,
  "depreciationMethod": "straight_line",
  "runDate": "2026-07-10T00:00:00.000Z"
}
```

Methods: `straight_line`, `reducing_balance`.

### `GET /api/assets/:id/timeline`

Requires `assets.read`.

Query parameters:

- `page`
- `limit`
- `eventType`

Event types include registered, updated, assigned, transferred, status_changed, maintenance_scheduled, maintenance_started, maintenance_completed, disposed, deleted, restored, and depreciation_recorded.

### `GET /api/assets/audit`

Requires `audit.read`.

Query parameters:

- `includeDeleted`

Returns asset counts, missing-data counts, status counts, and recognition/accounting treatment summary.

### `GET /api/assets/export`

Requires `reports.read`.

Exports assets to `.xlsx`. Supports the same query parameters as asset listing.

### `POST /api/assets/import`

Requires `assets.write`.

Accepts a multipart file upload with a single `.xlsx` file. Import limits are controlled by `ASSET_IMPORT_MAX_FILE_BYTES` and `ASSET_IMPORT_MAX_ROWS`.

## Branches

All branch endpoints are protected.

### `GET /api/branches`

Requires `branches.read`.

### `POST /api/branches`

Requires `branches.write`.

```json
{
  "name": "Lagos HQ",
  "code": "LOS-HQ",
  "description": "Main office"
}
```

### `GET /api/branches/:id`

Requires `branches.read`.

### `PATCH /api/branches/:id`

Requires `branches.write`.

### `DELETE /api/branches/:id`

Requires `branches.write`.

Query parameters:

- `force`

## Maintenance

All maintenance endpoints are protected.

### `GET /api/maintenance`

Requires `maintenance.read`.

Query parameters:

- `page`
- `limit`
- `status`: `open`, `in_progress`, `completed`, `cancelled`
- `assignedTo`
- `assetId`

### `POST /api/maintenance`

Requires `maintenance.write`.

```json
{
  "assetId": "uuid",
  "title": "Battery replacement",
  "description": "Battery health is below threshold",
  "priority": "high",
  "dueAt": "2026-07-20T00:00:00.000Z",
  "assignedTo": "uuid"
}
```

### `GET /api/maintenance/:id`

Requires `maintenance.read`.

### `PATCH /api/maintenance/:id`

Requires `maintenance.write`.

### `PATCH /api/maintenance/:id/complete`

Requires `maintenance.write`.

```json
{
  "note": "Battery replaced and tested"
}
```

## Notifications

All notification endpoints are protected.

### `GET /api/notifications`

Query parameters:

- `page`
- `limit`
- `unreadOnly`

### `PATCH /api/notifications/:id/read`

Marks one notification as read.

### `PATCH /api/notifications/read-all`

Marks all current user's notifications as read.
