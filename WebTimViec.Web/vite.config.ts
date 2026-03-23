import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.ngrok-free.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:5281',
        changeOrigin: true,
        secure: false,
      },
      '/webhook': {
        target: 'http://localhost:5281',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
