import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    cors: true,
    port: 5173,
    allowedHosts: ["skypacs.in"],
    proxy: {
      '/api': {
        target: 'http://api:5000', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
