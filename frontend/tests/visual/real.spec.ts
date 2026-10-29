import { test, expect } from '@playwright/test'
// Manual smoke run against the real backend (docker compose) through Vite on :5173. Not part of CI.
const BASE = 'http://localhost:5173'
const OUT = process.env.SHOT_DIR ?? 'shots'
test.setTimeout(180_000)
test('real flow', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
  page.on('response', (r) => { if (r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`) })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => localStorage.setItem('locale', 'es'))
  const email = `demo+${Date.now()}@example.com`

  await page.goto(BASE + '/')
  await page.locator('input[type=email]').first().fill(email)
  await page.locator('form button[type=submit]').first().click()
  await expect(page).toHaveURL(/\/register/)
  const inputs = page.locator('form input')
  await inputs.nth(0).fill('Ana García')
  await expect(inputs.nth(1)).toHaveValue(email)
  await inputs.nth(2).fill('contrasena-segura-1')
  await inputs.nth(3).fill('Acme Legal')
  await page.locator('form button[type=submit]').click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}/1-dashboard-empty.png` })

  await page.goto(BASE + '/documents/upload')
  await page.locator('input[type=file]').setInputFiles({ name: 'Contrato_Proveedor_Q3.txt', mimeType: 'text/plain',
    buffer: Buffer.from('Cláusula 9.1. Cualquiera de las partes podrá resolver el presente Contrato mediante preaviso por escrito de sesenta (60) días.\n'.repeat(20)) })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/2-uploaded.png` })
  await page.waitForTimeout(15_000)
  await page.screenshot({ path: `${OUT}/3-after-processing.png` })

  await page.goto(BASE + '/dashboard')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${OUT}/4-dashboard.png` })

  await page.goto(BASE + '/rooms/new')
  await page.locator('main form input').first().fill('Revisión legal Q3')
  await page.locator('main form button[type=submit]').click()
  await expect(page).toHaveURL(/\/rooms\/[a-f0-9]+/, { timeout: 10_000 })
  await page.locator('textarea').fill('¿Cuál es el plazo de preaviso?')
  await page.locator('textarea').press('Enter')
  await page.waitForTimeout(6000)
  await page.screenshot({ path: `${OUT}/5-room.png` })

  await page.goto(BASE + '/settings/members')
  await page.locator('main input[type=email]').fill(`colega+${Date.now()}@example.com`)
  await page.locator('main form button[type=submit]').click()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${OUT}/6-members.png` })
  console.log('ERRORS=' + JSON.stringify(errors))
})
