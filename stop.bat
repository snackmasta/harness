@echo off
title Stop Cable Harness App
cd /d "%~dp0"

echo ====================================================
echo   Stopping Cable Harness Planner and Measuring App
echo ====================================================
echo.

set STOPPED=0

:: 1. Find and kill process on port 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr :5173') do (
    echo Stopping server process PID %%a...
    taskkill /F /PID %%a >nul 2>&1
    set STOPPED=1
)

:: 2. Also close any window titled Cable Harness App - Server
taskkill /FI "WINDOWTITLE eq Cable Harness App - Server*" /F /T >nul 2>&1

:: 3. Verify port is freed
ping 127.0.0.1 -n 2 >nul
netstat -ano | findstr LISTENING | findstr :5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo Port 5173 is still busy. Forcing termination...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr :5173') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
if "%STOPPED%"=="1" (
    echo ====================================================
    echo   SUCCESS: Cable Harness App has been STOPPED
    echo ====================================================
    echo   Port 5173 is now closed.
) else (
    echo ====================================================
    echo   INFO: Cable Harness App was not running.
    echo ====================================================
)
echo.
ping 127.0.0.1 -n 3 >nul
exit /b 0
