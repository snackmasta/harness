@echo off
title Cable Harness App - Launcher
cd /d "%~dp0"

echo ====================================================
echo   Starting Cable Harness Planner and Measuring App
echo ====================================================
echo.

:: 1. Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js from https://nodejs.org/ to run this app.
    echo.
    pause
    exit /b 1
)

:: 2. Check node_modules
if not exist "node_modules\" (
    echo [SETUP] First-time setup: installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: 3. Check if already running on port 5173
netstat -ano | findstr LISTENING | findstr :5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] App is already running on http://localhost:5173/
    echo Opening browser...
    start http://localhost:5173/
    echo.
    echo To stop the server, run: stop.bat
    ping 127.0.0.1 -n 3 >nul
    exit /b 0
)

:: 4. Start Vite in a separate titled window
echo [STARTING] Launching Vite development server...
start "Cable Harness App - Server" cmd /k "title Cable Harness App - Server && npm run dev"

:: 5. Wait for server to come online
echo [WAITING] Waiting for server on http://localhost:5173/...
set READY=0
for /l %%i in (1,1,8) do (
    if "%READY%"=="0" (
        netstat -ano | findstr LISTENING | findstr :5173 >nul 2>&1
        if not errorlevel 1 (
            set READY=1
        ) else (
            ping 127.0.0.1 -n 2 >nul
        )
    )
)

:: 6. Open Browser
echo [READY] Opening http://localhost:5173/ in your browser...
start http://localhost:5173/

echo.
echo ====================================================
echo   Cable Harness Planner and Measuring App is RUNNING!
echo ====================================================
echo   Local URL: http://localhost:5173/
echo.
echo   - Keep the "Cable Harness App - Server" window open.
echo   - To stop the app at any time, run: stop.bat
echo ====================================================
echo.
ping 127.0.0.1 -n 4 >nul
exit /b 0
