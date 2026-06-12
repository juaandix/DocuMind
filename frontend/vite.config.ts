import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'

interface Ports {
  BACKEND_PORT: number
  FRONTEND_PORT: number
  NOTIFICATION_PORT: number
  ADMIN_PORT: number
}

function loadPorts(): Ports {
  const defaults: Ports = { BACKEND_PORT: 8000, FRONTEND_PORT: 5173, NOTIFICATION_PORT: 3001, ADMIN_PORT: 4200 }
  try {
    const portsPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.ports.json')
    return { ...defaults, ...JSON.parse(readFileSync(portsPath, 'utf-8')) }
  } catch {
    // .ports.json not yet generated — fall back to defaults
    return defaults
  }
}

export default defineConfig(() => {
  const ports = loadPorts()
  const backendUrl = `http://localhost:${ports.BACKEND_PORT}`

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: ports.FRONTEND_PORT,
      strictPort: false,
      proxy: {
        '/api': { target: backendUrl, changeOrigin: true },
        '/ws': { target: `ws://localhost:${ports.BACKEND_PORT}`, ws: true },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/unit/setup.ts'],
    },
  }
})
