@echo off
chcp 65001 >nul
title WIENA - web shop
cd /d "%~dp0"

echo.
echo   ==========================================
echo     WIENA - WEB SHOP
echo   ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js nije instaliran.
  echo   Preuzmite ga sa https://nodejs.org ^(verzija LTS^), instalirajte i ponovo pokrenite ovaj fajl.
  echo.
  pause
  exit /b 1
)

rem Ako shop vec radi, samo otvori browser
netstat -ano | findstr ":5174 " | findstr "LISTENING" >nul
if not errorlevel 1 (
  echo   Shop vec radi - otvaram browser...
  start "" "http://localhost:5174"
  ping -n 4 127.0.0.1 >nul
  exit /b 0
)

if not exist "node_modules" (
  echo   Prvo pokretanje: instaliram potrebne dodatke...
  call npm install
  echo.
)

echo   Shop:  http://localhost:5174
echo   Admin: http://localhost:5174/admin/
echo.
echo   Ostavite ovaj prozor otvoren dok koristite shop.
echo   Za gasenje shopa samo zatvorite ovaj prozor.
echo.

start "" cmd /c "ping -n 3 127.0.0.1 >nul & start http://localhost:5174"
node --disable-warning=ExperimentalWarning server/server.js

echo.
echo   Shop je zaustavljen.
pause
