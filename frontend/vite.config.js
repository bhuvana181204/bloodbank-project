import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // host: true binds to 0.0.0.0 — exposes the dev server on ALL network
    // interfaces so any device on the same WiFi can open the app.
    // This is required for QR codes to work on mobile / other laptops.
    host: true,
    port: 5173,
    strictPort: false, // use next available port if 5173 is busy
  },
})
