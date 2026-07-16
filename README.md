# Financial Asset Intelligence Platform API

Backend MVP for enterprise asset management. The API supports organization auth, role-based access, asset records, branch management, maintenance tasks, notifications, imports/exports, basic asset accounting classification, depreciation snapshot recording, and audit summaries.

## Current Status

- Runtime: Node.js, Express 5, TypeScript
- Database: PostgreSQL via Drizzle ORM
- Auth: JWT access/refresh tokens with hashed refresh token storage
- Email: Resend templates for onboarding, password reset OTP, and notifications
- Tests: Jest unit tests for assets, validators, and recognition logic
- Build: `pnpm build` compiles the server into `dist/`

## Main Capabilities

- User registration and login for personal or organization accounts
- Organization login by slug
- Password reset OTP flow
- Branch CRUD with soft delete support
- Asset CRUD with soft delete/restore
- Asset transfer, disposal, depreciation snapshot recording, and timeline
- Asset import/export through `.xlsx`
- Asset recognition policy: capitalized, expensed, tracked non-capitalized, pending review
- Audit summary endpoint for asset data quality and accounting treatment counts
- Maintenance task CRUD and completion flow
- In-app notifications and read/unread state
- Permission middleware for assets, branches, reports, audit, and maintenance routes

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm dev
```

The API runs on `http://localhost:6000` by default.

Health check:

```bash
GET /api/health
```

## Scripts

```bash
pnpm dev          # Start development server with nodemon and ts-node
pnpm build        # Compile TypeScript to dist/
pnpm start        # Run compiled server from dist/index.js
pnpm typecheck    # TypeScript check without emitting files
pnpm test         # Run Jest tests
pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Apply Drizzle migrations
```

## Documentation

- [Current capabilities](docs/CURRENT_STATE.md)
- [API reference](docs/API.md)
- [Deployment and finalization notes](docs/DEPLOYMENT.md)

## Important Scope Note

The accounting and audit features are MVP-level. The system tracks asset recognition, accounting treatment, depreciation snapshots, lifecycle events, disposals, and audit summary counts. It does not currently implement a full general ledger, journal entries, period close, reconciliation, or full field-level audit history.

