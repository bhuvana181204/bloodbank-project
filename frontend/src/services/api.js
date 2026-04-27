// src/services/api.js
import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────────
// getBaseUrl()
// Resolves the backend API URL in this priority:
//   1. VITE_API_URL env var — if set and not the placeholder
//   2. Dynamic: same host as the current page but on port 5000
//      This means if you open the app via http://192.168.1.5:5173,
//      API calls automatically go to http://192.168.1.5:5000/api —
//      so the app works on ANY device without touching .env at all.
// ─────────────────────────────────────────────────────────────────────────────
function getBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL || "";
  if (envUrl && !envUrl.includes("YOUR_LAN_IP")) {
    return envUrl;
  }
  // Derive from browser's current hostname (works on mobile, other laptops, etc.)
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5000/api`;
}

const API = axios.create({
  baseURL: getBaseUrl(),
});

// 🔐 Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// 🚨 Auto logout on 401
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default API;
