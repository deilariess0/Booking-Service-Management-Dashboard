import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 🔒 This is safe to upload to GitHub. It does NOT contain secrets.
  // It just tells Vite: "When I type /api in the frontend, send it to localhost:5000"
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})