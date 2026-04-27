@echo off
REM ================================================================
REM  setup-mobile-qr.bat  (Windows)
REM
REM  NOTE: You only need this if you want to hard-code your IP in
REM  frontend/.env for VITE_API_URL.
REM
REM  The backend now auto-detects its own LAN IP, so QR codes work
REM  automatically without any .env changes.
REM
REM  The ONLY reason to run this script is to fix the VITE_API_URL
REM  in frontend/.env so API calls from other devices work correctly.
REM
REM  HOW TO USE:
REM    1. Connect your laptop to WiFi
REM    2. Double-click this file
REM    3. Start backend:  cd backend && npm start
REM    4. Start frontend: cd frontend && npm run dev
REM    5. Share the Network URL shown in the frontend terminal
REM       (e.g. http://192.168.1.5:5173) with anyone on the same WiFi
REM ================================================================

echo Detecting LAN IP...

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0"') do (
    set "RAW_IP=%%a"
    goto :found
)

:found
set "LAN_IP=%RAW_IP: =%"

if "%LAN_IP%"=="" (
    echo ERROR: Could not detect LAN IP. Make sure you are connected to WiFi.
    pause
    exit /b 1
)

echo Detected LAN IP: %LAN_IP%

REM Patch frontend/.env only (backend detects its own IP automatically)
echo Updating frontend\.env ...
powershell -Command "(Get-Content 'frontend\.env') -replace 'VITE_API_URL=http://.*', 'VITE_API_URL=http://%LAN_IP%:5000/api' | Set-Content 'frontend\.env'"

echo.
echo ================================================================
echo  DONE! frontend\.env updated with IP: %LAN_IP%
echo.
echo  Next steps:
echo    1. Open a terminal in the 'backend' folder:
echo       npm install ^&^& npm start
echo.
echo    2. Open another terminal in the 'frontend' folder:
echo       npm install ^&^& npm run dev
echo.
echo    3. On ANY device (same WiFi), open:
echo       http://%LAN_IP%:5173
echo.
echo    4. QR codes now work on all mobiles and laptops!
echo ================================================================
pause
