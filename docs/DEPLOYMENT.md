# Deployment and Finalization Notes

## Required Environment Variables

See `.env.example` for a complete starting point.

Production must provide:

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `TOKEN_HASH_PEPPER`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `FRONTEND_URL`
- `CORS_ORIGIN`

Recommended production settings:

- `COOKIE_SECURE=true`
- `TRUST_PROXY=true` when running behind a reverse proxy
- Strong random secrets with at least 16 characters
- A real support email in `SUPPORT_EMAIL`
- `LOG_OTP_FOR_DEBUG=false`

## Database

The project uses Drizzle migrations in `src/db/migrations`.

Run migrations before starting the deployed API:

```bash
pnpm db:migrate
```

If a new schema change is made:

```bash
pnpm db:generate
pnpm db:migrate
```

## Build and Start

```bash
pnpm install
pnpm build
pnpm start
```

The compiled entrypoint is `dist/index.js`.

## Verification Checklist

Before handoff or deployment:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

Smoke test these flows:

- `GET /api/health`
- Register organization
- Login
- Refresh token
- Create branch
- Create asset
- List asset
- Update asset
- Transfer asset
- Record depreciation snapshot on a capitalized asset
- View asset timeline
- View asset audit summary
- Create maintenance task
- Complete maintenance task
- List notifications
- Export assets
- Import a small `.xlsx` asset file

## Current Known Gaps

These are not blockers for an MVP, but they should be clear in any final handoff:

- Accounting is limited to asset recognition, accounting treatment, and depreciation snapshots.
- There is no general ledger or journal entry module.
- Depreciation values are accepted from the client after validation; the API does not calculate depreciation.
- Audit reporting is summary-level and lifecycle-event based, not full field-level audit history.
- There is no OpenAPI specification yet.
- There is no seed script for sample data.
- The organization bootstrap seeds auditor read permissions, but custom non-admin write roles are not seeded yet.
- Tests do not yet cover every module.

## Recommended Next Work

Highest value next steps:

1. Add OpenAPI/Swagger documentation.
2. Add auth, branch, maintenance, notification, audit, and depreciation tests.
3. Add a production seed/admin bootstrap process if needed.
4. Add field-level audit logs if audit readiness is a project requirement.
5. Add a real depreciation calculation service if accounting ownership moves server-side.
6. Add deployment-specific docs for the chosen host.
