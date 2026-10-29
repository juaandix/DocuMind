import { test, expect } from '@playwright/test'
import { mockApi, loginViaStorage } from '../e2e/mock-api'

const OUT = process.env.SHOT_DIR ?? 'shots'
for (const locale of ['es', 'en']) for (const vp of [{ n: 'desktop', width: 1440, height: 900 }, { n: 'mobile', width: 390, height: 844 }]) {
  test(`landing ${locale} ${vp.n}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await mockApi(page)
    await page.addInitScript((l) => localStorage.setItem('locale', l), locale)
    await page.goto('/')
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${OUT}/landing-${locale}-${vp.n}.png`, fullPage: true })
    await page.screenshot({ path: `${OUT}/landing-${locale}-${vp.n}-fold.png` })
  })
}

test('landing email carries into register; signed-in users skip it', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await page.locator('input[type=email]').first().fill('ana@example.com')
  await page.locator('form button[type=submit]').first().click()
  await expect(page).toHaveURL(/\/register\?email=ana(@|%40)example\.com$/)
  await expect(page.locator('input[type=email]')).toHaveValue('ana@example.com')

  await page.locator('a[href="/login"]').first().isVisible()
  await loginViaStorage(page)
  await page.goto('/')
  await expect(page).toHaveURL(/\/dashboard$/)
})

test('citations in the live answer open their pass', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'S3', exact: true }).click()
  await expect(page.getByRole('button', { name: 'S3', exact: true })).toHaveAttribute('aria-pressed', 'true')
})
