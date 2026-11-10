@echo off
chcp 65001 >nul
title WIENA - backup
cd /d "%~dp0"

echo.
echo   ==========================================
echo     WIENA - BACKUP
echo   ==========================================

where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js nije instaliran. Preuzmite ga sa https://nodejs.org
  pause
  exit /b 1
)
if not exist "data\shop.db" (
  echo   Baza shopa jos ne postoji - prvo pokrenite shop.
  pause
  exit /b 1
)

node --disable-warning=ExperimentalWarning tools\backup.js
if errorlevel 1 (
  echo   Backup NIJE uspio - pogledajte poruku iznad.
) else (
  start "" explorer "%USERPROFILE%\Desktop\Wiena-Backups"
)
pause
