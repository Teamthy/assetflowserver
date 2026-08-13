@echo off
setlocal
cd /d "%~dp0"

if not exist .env copy .env.example .env

where docker >nul 2>nul
if %ERRORLEVEL%==0 (
  docker compose up -d
)

call pnpm add handlebars bullmq ioredis
call pnpm db:migrate
echo.
echo Starting API. Wait for: API running on port 6000
echo Then check: http://127.0.0.1:6000/api/health
echo.
call pnpm dev
