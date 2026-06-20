import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: env.PROXY_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'User-Agent': 'localtunnel'
          }
        },
        '/socket.io': {
          target: env.PROXY_API_URL || 'http://localhost:5000',
          ws: true,
          changeOrigin: true,
          secure: false,
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'User-Agent': 'localtunnel'
          }
        }
      }
    }
  }
})
