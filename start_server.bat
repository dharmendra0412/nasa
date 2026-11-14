@echo off
title NASA Mission Control - Local Network Server
cd /d "%~dp0"
echo ===============================================================
echo Starting NASA Mission Control Local Web Server...
echo ===============================================================
node server.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Node.js not found or error occurred. Trying Python fallback...
    python -m http.server 8080 --bind 0.0.0.0
)
pause
