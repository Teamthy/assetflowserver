@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set /p DATABASE_URL=Paste your cloud DATABASE_URL: 
if "%DATABASE_URL%"=="" (
  echo DATABASE_URL is required.
  exit /b 1
)

> .env (
  echo NODE_ENV=development
  echo PORT=6000
  echo DATABASE_URL=%DATABASE_URL%
  echo JWT_SECRET=dev-jwt-secret-change-me-12345
  echo JWT_REFRESH_SECRET=dev-jwt-refresh-secret-change-me-12345
  echo TOKEN_HASH_PEPPER=dev-token-hash-pepper-change-me-12345
  echo CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:8080
  echo FRONTEND_URL=http://localhost:3000
  echo RESEND_API_KEY=re_dev_placeholder
  echo RESEND_FROM_EMAIL=noreply@localhost.local
  echo SUPPORT_EMAIL=support@example.com
  echo LOG_OTP_FOR_DEBUG=true
  echo ENFORCE_RBAC=false
)

echo Wrote .env
findstr /B "DATABASE_URL= PORT=" .env
echo Next: pnpm db:migrate then pnpm dev
