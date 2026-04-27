#!/bin/bash
echo ""
echo "================================================"
echo "  BLOODCHAIN SETUP - First Time Only"
echo "================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed."
    echo "        Download from: https://nodejs.org (LTS version)"
    exit 1
fi
echo "[OK] Node.js: $(node --version)"

echo ""
echo "[1/2] Installing backend packages..."
cd backend && npm install
if [ $? -ne 0 ]; then echo "[ERROR] Backend install failed."; exit 1; fi
echo "[OK] Backend packages installed."

echo ""
echo "[2/2] Installing frontend packages..."
cd ../frontend && npm install
if [ $? -ne 0 ]; then echo "[ERROR] Frontend install failed."; exit 1; fi
echo "[OK] Frontend packages installed."

echo ""
echo "================================================"
echo "  SETUP COMPLETE!"
echo "================================================"
echo ""
echo "  HOW TO RUN (open 2 separate terminals):"
echo ""
echo "  Terminal 1 - Backend:"
echo "    cd backend && node server.js"
echo ""
echo "  Terminal 2 - Frontend:"
echo "    cd frontend && npm run dev"
echo ""
echo "  Then open: http://localhost:5173"
echo ""
echo "  FIRST TIME? Register at /register"
echo "  (choose Admin, Donor, or Blood Bank)"
echo ""
