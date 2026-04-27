@echo off
title BloodChain Setup
color 0A
echo.
echo ================================================
echo   BLOODCHAIN SETUP - First Time Only
echo ================================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo         Download from: https://nodejs.org  (choose LTS version)
    pause
    exit /b 1
)
echo [OK] Node.js found: 
node --version

echo.
echo [1/2] Installing backend packages...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Backend install failed. Check internet connection.
    pause
    exit /b 1
)
echo [OK] Backend packages installed.

echo.
echo [2/2] Installing frontend packages...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Frontend install failed. Check internet connection.
    pause
    exit /b 1
)
echo [OK] Frontend packages installed.

echo.
echo ================================================
echo   SETUP COMPLETE!
echo ================================================
echo.
echo   HOW TO RUN (open 2 separate CMD windows):
echo.
echo   Window 1 - Backend:
echo     cd backend
echo     node server.js
echo.
echo   Window 2 - Frontend:
echo     cd frontend
echo     npm run dev
echo.
echo   Then open: http://localhost:5173
echo.
echo   FIRST TIME? Register an account at /register
echo   (choose Admin, Donor, or Blood Bank)
echo.
pause
