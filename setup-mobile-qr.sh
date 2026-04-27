#!/bin/bash
# ================================================================
#  setup-mobile-qr.sh  (Mac / Linux)
#
#  Patches frontend/.env with your LAN IP so VITE_API_URL works
#  from any device on the same WiFi.
#  The backend detects its own IP automatically — no changes needed there.
# ================================================================

echo "Detecting LAN IP..."

# Works on both Linux and Mac
LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}')
if [ -z "$LAN_IP" ]; then
  # Mac fallback
  LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
fi

if [ -z "$LAN_IP" ]; then
  echo "ERROR: Could not detect LAN IP. Make sure you are connected to WiFi."
  exit 1
fi

echo "Detected LAN IP: $LAN_IP"

# Patch frontend/.env
sed -i.bak "s|VITE_API_URL=http://.*|VITE_API_URL=http://$LAN_IP:5000/api|" frontend/.env
echo "Updated frontend/.env"

echo ""
echo "================================================================"
echo " DONE! LAN IP: $LAN_IP"
echo ""
echo " Steps:"
echo "   1. cd backend && npm install && npm start"
echo "   2. cd frontend && npm install && npm run dev"
echo "   3. Open on any device (same WiFi): http://$LAN_IP:5173"
echo "   4. QR codes now work on all devices!"
echo "================================================================"
