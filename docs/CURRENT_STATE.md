# Current State

This document summarizes what the backend currently supports.

## Stack

- Express 5 API server
- TypeScript with strict mode
- PostgreSQL database
- Drizzle ORM and Drizzle Kit migrations
- Zod request validation
- JWT authentication
- Resend email delivery
- Jest unit tests
- Winston and Morgan logging

## Auth and Organizations

The auth module supports:

- Personal account registration
- Organization account registration
- Organization login by slug
- Standard login by email/password
- Access and refresh token issuing
- Refresh token rotation/storage support
- Logout and logout-all
- Password verification
- Password change
- Password reset OTP request and confirmation
- Onboarding welcome email

When an organization is created, the system seeds:

- Starter plan
- Owner user
- Organization record
- Active owner membership
- System admin role
- System auditor role
- Read-oriented permissions for assets, branches, audit, and reports

Permission checks allow organization owners and users with the `admin` role directly. The seeded auditor role receives read/report/audit permissions only.

## Assets

The asset module supports:

- Create, list, read, update, and soft-delete assets
- Restore soft-deleted assets
- Assign assets to users
- Associate assets with branches
- Transfer assets between branches/users
- Dispose assets with method, reason, proceeds, approver, notes, and disposal date
- Record depreciation snapshots per fiscal year
- Read a combined asset timeline
- Import assets from `.xlsx`
- Export assets to `.xlsx`
- Warranty-expiry notification support

Asset fields include:

- Basic identity: name, description, asset tag, serial number, category, manufacturer, model
- Ownership context: organization, branch, assignee
- Operational state: status and condition
- Financial fields: purchase cost, purchase date, residual value, useful life
- Recognition fields: future economic benefit, reliable cost measurement, recognition status, accounting treatment, recognition reasons, capitalization threshold
- Depreciation flag: `isDepreciable`

## Asset Accounting Scope

Current accounting support is asset-accounting metadata, not a complete accounting ledger.

Implemented:

- Recognition evaluation during asset create/update
- Default capitalization policy:
  - Capitalization threshold: `50000`
  - Currency: `NGN`
  - Minimum useful life: `12` months
  - Low-value assets are tracked as non-capitalized by default
- Accounting treatment values:
  - `capitalized`
  - `expensed`
  - `tracked_non_capitalized`
  - `pending_review`
- Depreciation snapshot storage
- Validation that only capitalized/depreciable assets can receive depreciation snapshots
- Lifecycle event when depreciation is recorded

Not implemented:

- General ledger
- Journal entries
- Double-entry posting
- Accounting period close/lock
- Automatic depreciation calculation engine
- Reconciliation reports
- Tax schedules

## Audit Scope

Implemented:

- `GET /api/assets/audit`
- Asset data quality counts:
  - Total assets
  - Missing serial numbers
  - Missing purchase dates
  - Missing categories
  - Disposed assets
  - Assets under maintenance
- Recognition/accounting treatment counts
- Auditor role with read-only audit/report permission seeds
- Asset lifecycle events for important asset actions

Not implemented:

- Full field-level before/after audit logs
- Audit comments or sign-off workflow
- Evidence attachments
- Immutable audit ledger
- Exportable formal audit report package

## Branches

The branch module supports:

- Create branch
- List branches
- Read branch by ID
- Update branch
- Soft delete branch
- Optional force deletion behavior through query validation
- Unique branch name/code per organization for non-deleted branches

## Maintenance

The maintenance module supports:

- Create maintenance task
- List tasks with filters
- Read task by ID
- Update task
- Complete task
- Status values: `open`, `in_progress`, `completed`, `cancelled`
- Priority values: `low`, `medium`, `high`, `critical`
- Assignment to a user
- Due date
- Completion note and completed-by tracking

## Notifications

The notification module supports:

- List notifications
- Filter unread notifications
- Mark one notification as read
- Mark all notifications as read

Notification types include maintenance, asset assignment/transfer/update/delete/disposal, warranty expiry, depreciation completion, branch events, approval, organization invite, password reset, audit issue, and system alert.

## Current Test Coverage

Existing tests cover:

- Asset service behavior
- Asset validator rules
- Asset recognition service edge case

Coverage gaps before a production handoff:

- Auth flows
- Branch CRUD
- Maintenance flows
- Notifications
- Audit summary repository behavior
- Depreciation recording permissions and conflict behavior
- Import/export edge cases
