import { expect, test } from '@playwright/test'
import { mockApi } from './mock-api'

test.describe('Authentication', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    await mockApi(page)
    await page.goto('/documents')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Sign in to DocuMind' })).toBeVisible()
  })

  test('shows the API error on wrong credentials', async ({ page }) => {
    await mockApi(page)
    await page.goto('/login')
    await page.getByPlaceholder('you@example.com').fill('ana@example.com')
    await page.getByPlaceholder('••••••••').fill('wrong')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Incorrect email or password')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('logs in, stores tokens and greets the user on the dashboard', async ({ page }) => {
    await mockApi(page)
    await page.goto('/login')
    await page.getByPlaceholder('you@example.com').fill('ana@example.com')
    await page.getByPlaceholder('••••••••').fill('correct-password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ana')
    expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBe('access-1')
    expect(await page.evaluate(() => localStorage.getItem('refresh_token'))).toBe('refresh-1')
  })

  test('unknown routes render the 404 page', async ({ page }) => {
    await mockApi(page)
    await page.goto('/this-does-not-exist')
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})
