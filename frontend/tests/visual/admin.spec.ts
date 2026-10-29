import { test } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Screenshots of the Angular admin (served separately on :4200) with a mocked API.
const FIX = '../admin-panel/tests/e2e/fixtures'
const json = (f: string) => JSON.parse(readFileSync(`${FIX}/${f}`, 'utf8'))
const OUT = process.env.SHOT_DIR ?? 'shots'
const users = [
  { id: 'u1', full_name: 'Ana García', email: 'ana@acme.test', role: 'OWNER', workspace_name: 'Acme Legal', is_active: true, last_login: '2026-10-27T09:00:00Z' },
  { id: 'u2', full_name: 'María López', email: 'maria@acme.test', role: 'ADMIN', workspace_name: 'Acme Legal', is_active: true, last_login: '2026-10-26T15:20:00Z' },
  { id: 'u3', full_name: 'Jorge Ruiz', email: 'jorge@globex.test', role: 'MEMBER', workspace_name: 'Globex Research', is_active: false, last_login: null },
]
const jobs = [
  { id: 'j1', task_name: 'process_document', status: 'SUCCESS', duration_seconds: 12.4, error: null, started_at: '2026-10-28T13:58:00Z' },
  { id: 'j2', task_name: 'process_document', status: 'STARTED', duration_seconds: null, error: null, started_at: '2026-10-28T14:02:00Z' },
  { id: 'j3', task_name: 'export_room_pdf', status: 'FAILURE', duration_seconds: 3.1, error: 'ValueError: room has no messages', started_at: '2026-10-28T13:40:00Z' },
  { id: 'j4', task_name: 'process_document', status: 'PENDING', duration_seconds: null, error: null, started_at: null },
]
const notifications = [
  { id: 'n1', type: 'document_ready', title: 'Contrato_Proveedor_Q3.pdf is ready', user_email: 'ana@acme.test', email_sent: true, created_at: '2026-10-28T13:58:00Z' },
  { id: 'n2', type: 'export_ready', title: 'Your PDF export is ready', user_email: 'maria@acme.test', email_sent: false, created_at: '2026-10-28T12:10:00Z' },
]

for (const scheme of ['light', 'dark'] as const) {
  for (const path of ['/login', '/dashboard', '/workspaces', '/users', '/logs', '/notifications']) {
    test(`admin ${scheme} ${path}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.route('**/api/v1/admin/platform/**', (r) => {
        const u = r.request().url()
        if (u.includes('/stats/history')) return r.fulfill({ json: json('stats-history.json') })
        if (u.includes('/stats')) return r.fulfill({ json: json('stats.json') })
        if (u.includes('/workspaces')) return r.fulfill({ json: json('workspaces.json') })
        if (u.includes('/users')) return r.fulfill({ json: users })
        if (u.includes('/jobs')) return r.fulfill({ json: jobs })
        if (u.includes('/notifications')) return r.fulfill({ json: notifications })
        return r.fulfill({ json: {} })
      })
      if (path !== '/login') await page.addInitScript(() => localStorage.setItem('admin_token', 'e2e-fake-token'))
      await page.goto(`http://localhost:4200${path}`)
      await page.waitForTimeout(1200)
      await page.screenshot({ path: `${OUT}/admin-${path.slice(1)}-${scheme}.png`, fullPage: true })
    })
  }
}
