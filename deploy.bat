@echo off
title ThriftFind Deployer
echo ================================================
echo  ThriftFind - Production Deploy Script
echo ================================================
echo.

cd /d "%~dp0"

echo [1/5] Stopping PM2...
call pm2 stop thriftersfind 2>nul
call pm2 kill 2>nul
timeout /t 2 /nobreak >nul
echo Done.

echo [2/5] Installing dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 ( echo ERROR: npm install failed & pause & exit /b 1 )

echo [3/5] Running Prisma generate...
call npx prisma generate
if %errorlevel% neq 0 ( echo ERROR: Prisma generate failed & pause & exit /b 1 )

echo [4/5] Syncing database schema...
call npx prisma db push --accept-data-loss
if %errorlevel% neq 0 ( echo ERROR: Prisma db push failed & pause & exit /b 1 )

echo [5/5] Building the app...
call npm run build
if %errorlevel% neq 0 ( echo ERROR: Build failed & pause & exit /b 1 )

echo Starting PM2...
call pm2 start ecosystem.config.js
call pm2 save

echo.
echo ================================================
echo  Deploy complete! App running on port 3000.
echo  Run "pm2 logs thriftersfind" to view logs.
echo ================================================
pause
