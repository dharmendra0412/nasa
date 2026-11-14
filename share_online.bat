@echo off
title NASA Mission Control - Share Online With Friends
cd /d "%~dp0"
echo ===============================================================
echo   GENERATING SECURE PUBLIC HTTPS LINK FOR ONLINE MULTIPLAYER
echo ===============================================================
echo.
echo Make sure "start_server.bat" or "node server.js" is running!
echo.
echo Connecting to global tunnel...
npx localtunnel --port 8080
pause
