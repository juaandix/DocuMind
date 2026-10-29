import { test, expect } from '@playwright/test'
import { mockApi, loginViaStorage } from '../e2e/mock-api'

test('menus and drawer open, animate and close', async ({ page }) => {
  await mockApi(page)
  await loginViaStorage(page)
  await page.goto('/dashboard')
  await page.getByRole('button', { name: /Account menu/ }).click()
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()

  await page.getByRole('button', { name: 'Notifications' }).click()
  const panel = page.getByRole('dialog')
  await expect(panel).toBeVisible()
  // Mid-enter the panel is translated; once settled it sits at its resting place.
  await expect.poll(async () => panel.evaluate((el) => getComputedStyle(el).transform)).toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})
