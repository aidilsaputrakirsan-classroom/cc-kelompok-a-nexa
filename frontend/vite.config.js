import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
  proxy: {
    // Proxy untuk Items (sekarang ke 8002)
    '/items': {
      target: 'http://127.0.0.1:8002',
      changeOrigin: true,
    },
    // Jika perlu proxy untuk Auth (sekarang ke 8001)
    '/auth': {
      target: 'http://127.0.0.1:8001',
      changeOrigin: true,
    }
  }
},
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    deps: {
      optimizer: {
        web: {
          include: ['@exodus/bytes', 'html-encoding-sniffer']
        }
      }
    }
  }
})