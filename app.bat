@echo off
title Cable Harness App Control
cd /d "%~dp0"

:menu
cls
echo ============================================================
echo           CABLE HARNESS PLANNER AND MEASURING APP
echo ============================================================

:: Check Status
netstat -ano | findstr LISTENING | findstr :5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo   Status: [ RUNNING on http://localhost:5173/ ]
) else (
    echo   Status: [ STOPPED ]
)
echo ============================================================
echo.
echo   [1] Start App       (Launch Vite server and open browser)
echo   [2] Stop App        (Stop server and free port 5173)
echo   [3] Restart App     (Restart server cleanly)
echo   [4] Open in Browser (http://localhost:5173/)
echo   [5] Exit
echo.
echo ============================================================
set /p "CHOICE=Enter choice [1-5]: "

if "%CHOICE%"=="1" goto start_app
if "%CHOICE%"=="2" goto stop_app
if "%CHOICE%"=="3" goto restart_app
if "%CHOICE%"=="4" goto open_browser
if "%CHOICE%"=="5" exit /b 0

echo Invalid choice. Please choose 1-5.
ping 127.0.0.1 -n 2 >nul
goto menu

:start_app
echo.
call "%~dp0start.bat"
goto menu

:stop_app
echo.
call "%~dp0stop.bat"
goto menu

:restart_app
echo.
call "%~dp0stop.bat"
call "%~dp0start.bat"
goto menu

:open_browser
echo.
echo Opening http://localhost:5173/...
start http://localhost:5173/
ping 127.0.0.1 -n 2 >nul
goto menu
