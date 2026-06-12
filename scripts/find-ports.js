#!/usr/bin/env node
/**
 * DocuMind port discovery script.
 *
 * Finds a free port for each service starting from its default, then writes:
 *   - <root>/.ports.json        → read by Vite config at dev-server start
 *   - <root>/.ports.env         → sourced by start-dev.sh
 *   - backend/.env.ports        → read by pydantic-settings (FRONTEND_PORT, ADMIN_PORT)
 *   - admin-panel/proxy.conf.json → Angular dev-server proxy target
 */

const net = require('net')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

const SERVICES = [
  { key: 'BACKEND_PORT',      label: 'Backend      ', default: 8000 },
  { key: 'NOTIFICATION_PORT', label: 'Notification ', default: 3001 },
  { key: 'FRONTEND_PORT',     label: 'Frontend     ', default: 5173 },
  { key: 'ADMIN_PORT',        label: 'Admin Panel  ', default: 4200 },
]

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port, '127.0.0.1')
  })
}

async function findFreePort(startPort) {
  let port = startPort
  while (!(await isPortFree(port))) {
    port++
  }
  return port
}

async function main() {
  console.log('\n  DocuMind — Port Discovery\n')

  const ports = {}

  for (const svc of SERVICES) {
    const found = await findFreePort(svc.default)
    ports[svc.key] = found
    const occupied = found !== svc.default ? `  ⚠  :${svc.default} was busy` : ''
    console.log(`  ${svc.label}  :${svc.default} → :${found}${occupied}`)
  }

  // ── .ports.json (read by Vite config) ───────────────────────────────────
  const portsJsonPath = path.join(ROOT, '.ports.json')
  fs.writeFileSync(portsJsonPath, JSON.stringify(ports, null, 2) + '\n')

  // ── .ports.env (sourced by start-dev.sh) ────────────────────────────────
  const portsEnvPath = path.join(ROOT, '.ports.env')
  const envLines = Object.entries(ports).map(([k, v]) => `export ${k}=${v}`)
  fs.writeFileSync(portsEnvPath, envLines.join('\n') + '\n')

  // ── backend/.env.ports (read by pydantic-settings) ──────────────────────
  // Only writes the values the backend needs to know: where the frontends are.
  const backendEnvPorts = [
    `FRONTEND_PORT=${ports.FRONTEND_PORT}`,
    `ADMIN_PORT=${ports.ADMIN_PORT}`,
    `BACKEND_PORT=${ports.BACKEND_PORT}`,
  ].join('\n') + '\n'
  fs.writeFileSync(path.join(ROOT, 'backend', '.env.ports'), backendEnvPorts)

  // ── admin-panel/proxy.conf.json (Angular dev-server proxy) ──────────────
  const proxyConf = {
    '/api': {
      target: `http://localhost:${ports.BACKEND_PORT}`,
      secure: false,
      changeOrigin: true,
      logLevel: 'warn',
    },
    '/ws': {
      target: `ws://localhost:${ports.BACKEND_PORT}`,
      secure: false,
      ws: true,
    },
  }
  fs.writeFileSync(
    path.join(ROOT, 'admin-panel', 'proxy.conf.json'),
    JSON.stringify(proxyConf, null, 2) + '\n'
  )

  console.log('\n  Generated:')
  console.log('    .ports.json             (Vite config)')
  console.log('    .ports.env              (start-dev.sh)')
  console.log('    backend/.env.ports      (FastAPI CORS)')
  console.log('    admin-panel/proxy.conf.json  (Angular proxy)\n')

  console.log('  Service URLs:')
  console.log(`    API:           http://localhost:${ports.BACKEND_PORT}`)
  console.log(`    Swagger:       http://localhost:${ports.BACKEND_PORT}/docs`)
  console.log(`    Frontend:      http://localhost:${ports.FRONTEND_PORT}`)
  console.log(`    Admin Panel:   http://localhost:${ports.ADMIN_PORT}`)
  console.log(`    Notification:  http://localhost:${ports.NOTIFICATION_PORT}`)
  console.log()
}

main().catch((err) => {
  console.error('Port discovery failed:', err.message)
  process.exit(1)
})
