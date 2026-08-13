# AssetFlow Server

Express + TypeScript API for AssetFlow, a multi-tenant fixed-asset register.

## Stack

- Express 5, Drizzle ORM, PostgreSQL
- JWT access + refresh tokens
- Permission-based RBAC (`admin`, `asset_manager`, `finance`, `auditor`, `branch_manager`, `maintenance_staff`, `standard_staff`)

## Local setup

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

API listens on `http://localhost:6000`. Health check: `GET /api/health`. Swagger: `GET /api/docs`.

## Auth contract

Login, register, org-login, refresh, and invitation accept return:

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "firstName": "...", "lastName": "...", "email": "..." },
    "organization": { "id": "...", "name": "...", "slug": "..." },
    "role": "admin",
    "roles": ["admin"],
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

`GET /api/auth/me` returns the same membership context for an existing session.

## Notes

- Do not commit `.env` or `.pnpm-store`.
- Apply migrations before starting the API.
