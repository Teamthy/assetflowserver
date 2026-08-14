# Deploy AssetFlow API — Render + Neon

Client = Next.js on **Vercel**. API = this Express app on **Render**.  
Do **not** deploy this API to Vercel. BullMQ, disk uploads, and a long-lived Postgres pool need a real Node process.

Local PORT is **7000**. On Render, **do not set `PORT`**. Render injects its own port and the app already reads `process.env.PORT`.

## 0. Push the branch first

Render deploys from GitHub. From Windows PowerShell:

```powershell
cd C:\Users\USER\Desktop\PROJECTS\Assetflow\assetflowserver
git checkout feat/production-ready
git remote set-url origin https://github.com/olumatty/Assetflowserver.git
git push -u origin feat/production-ready
git push backup feat/production-ready
```

Open the PR (do not commit to `main`):  
https://github.com/olumatty/Assetflowserver/compare/main...feat/production-ready

## 1. Neon (already in use locally)

Reuse the same Neon database. In Neon, copy the connection string.

Prefer the **pooled** URI (`-pooler` in the host) for Render.  
`channel_binding` / `sslmode` query params are stripped by the app. Paste the URI as Neon gives it.

Run migrations once before the first public traffic (local is fine if Render migrate is not set yet):

```powershell
cd C:\Users\USER\Desktop\PROJECTS\Assetflow\assetflowserver
pnpm db:migrate
```

## 2. Create the Render web service

1. https://dashboard.render.com → **New** → **Web Service**.
2. Connect GitHub → `olumatty/Assetflowserver` (or `Teamthy/assetflowserver` if that is what you pushed).
3. Settings:

| Field | Value |
|---|---|
| Name | `assetflow-api` |
| Region | Frankfurt (closer to Lagos) |
| Branch | `feat/production-ready` |
| Runtime | Node |
| Instance | Free or Starter |
| Build command | `npm install --include=dev && npm run build && node dist/src/scripts/migrate.js` |
| Start command | `node dist/index.js` |
| Health check path | `/api/health` |

`typescript` is a **devDependency**. `--include=dev` is required or `tsc` is missing and the build dies.

## 3. Environment variables on Render

Generate three secrets in PowerShell (run three times):

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

Add these in Render → Environment. **Do not add `PORT`.**

```
NODE_ENV=production
NODE_VERSION=20
TRUST_PROXY=true
DATABASE_URL=<paste Neon URI — do not commit it>
JWT_SECRET=<generated, 32+ chars>
JWT_REFRESH_SECRET=<different generated value>
TOKEN_HASH_PEPPER=<different generated value>
FRONTEND_URL=https://useassetflow-teamthy1.vercel.app
CORS_ORIGIN=https://useassetflow-teamthy1.vercel.app
ENFORCE_RBAC=false
PG_CONNECTION_TIMEOUT_MS=20000
PG_STATEMENT_TIMEOUT_MS=60000
RESEND_API_KEY=re_replace_me
RESEND_FROM_EMAIL=noreply@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
LOG_OTP_FOR_DEBUG=false
```

`RESEND_API_KEY` and `RESEND_FROM_EMAIL` are **required to boot** in production.  
Use a real [Resend](https://resend.com) key if you want forgot-password / invites to arrive. A non-empty placeholder lets the API start; mail just will not send.

`FRONTEND_URL` / `CORS_ORIGIN` get the real Vercel URL in step 5. `*.vercel.app` is already allowed in code.

## 4. Deploy and confirm

Click **Create Web Service**. Wait until the log shows `API running on port …` (Render’s port, not 7000).

```powershell
Invoke-RestMethod -UseBasicParsing https://assetflow-api.onrender.com/api/health
# Expect: status = ok
```

Replace the host with the URL Render printed (`https://<name>.onrender.com`).

Free tier sleeps after ~15 minutes. The first request after sleep can take 30–60s (Render cold + Neon cold).

## 5. After Vercel exists

Set on Render and save (Render restarts the service):

```
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
```

If you add a custom domain later, put that exact `https://…` origin in both.

**Vercel Deployment Protection must be off** or every page 302s to `vercel.com/sso-api` and e2e/register look dead. Vercel → project → Settings → Deployment Protection → Disabled, then Promote to Production.

## Optional worker

Leave Redis empty for ~100 DAU. Jobs run inline on the cron scheduler.

If you add Redis later: New → Key Value (or Redis) on Render, then set `REDIS_URL` and a second Background Worker with start command `node dist/src/worker.js`.
