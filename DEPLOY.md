# Deploy AssetFlow

## Client — Vercel

The Next.js app in `assetflowclient` is the Vercel target.

1. Import the GitHub repo (or `feat/production-ready`) in Vercel.
2. Root directory: `assetflowclient` if the repo is a monorepo; otherwise the client repo root.
3. Environment variables:

```
NEXT_PUBLIC_API_URL=https://YOUR-API-HOST/api
NEXT_PUBLIC_APP_NAME=AssetFlow
NEXT_PUBLIC_ENFORCE_RBAC=false
```

4. Build command: `npm run build`

## API + worker — not Vercel

BullMQ workers need a long-lived Node process and Redis/Valkey. Deploy the server on Railway, Render, Fly, or a VM.

```
pnpm install
pnpm build
pnpm db:migrate
pnpm start          # API :6000
pnpm start:worker   # BullMQ worker (requires REDIS_URL or VALKEY_URL)
```

If Redis is unset, the API still runs jobs inline on the cron schedule.

Server env (minimum):

```
NODE_ENV=production
PORT=6000
DATABASE_URL=postgres://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
TOKEN_HASH_PEPPER=...
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@yourdomain.com
ENFORCE_RBAC=false
REDIS_URL=redis://...
```

Local CORS already allows any `http://localhost:*` and `*.vercel.app`.
