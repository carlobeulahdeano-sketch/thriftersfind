@echo off
title ThriftFind Quick Redeploy
echo ================================================
echo  ThriftFind - Quick Redeploy (Code Changes Only)
echo ================================================
echo.

cd /d "%~dp0"

echo [1/2] Building the app...
call npm run build
if %errorlevel% neq 0 ( echo ERROR: Build failed & pause & exit /b 1 )

echo [2/2] Restarting PM2...
call pm2 restart thriftersfind
call pm2 save

echo.
echo ================================================
echo  Redeploy complete! App restarted on port 3000.
echo  Run "pm2 logs thriftersfind" to view logs.
echo ================================================
pause
