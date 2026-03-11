import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Load env from .env, .env.local, .env.[mode], etc.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5000'
  const port = parseInt(env.VITE_DEV_PORT || '5173', 10)

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/health': { target: apiTarget, changeOrigin: true },
        '/status': { target: apiTarget, changeOrigin: true },
      },
    },
  }
})
