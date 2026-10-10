import { expect, test } from '@playwright/test'
import { loginViaStorage, makeDocument, mockApi } from './mock-api'

const docs = [
  makeDocument({ id: 'd1', original_name: 'contract.pdf', tags: ['legal'] }),
  makeDocument({ id: 'd2', original_name: 'invoice-march.pdf', status: 'PROCESSING', chunk_count: null }),
  makeDocument({ id: 'd3', original_name: 'broken.docx', status: 'ERROR', error_message: 'Parse failed' }),
  makeDocument({ id: 'd4', original_name: 'nda.pdf', tags: ['legal', 'signed'] }),
]

test.describe('Documents', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaStorage(page)
  })

  test('lists all documents with their status', async ({ page }) => {
    await mockApi(page, { documents: docs })
    await page.goto('/documents')

    await expect(page.getByText('4 documents in your workspace')).toBeVisible()
    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(4)
    await expect(rows.filter({ hasText: 'invoice-march.pdf' })).toContainText('Processing')
    await expect(rows.filter({ hasText: 'broken.docx' })).toContainText('Error')
  })

  test('filters by search, status and tag', async ({ page }) => {
    await mockApi(page, { documents: docs })
    await page.goto('/documents')
    const rows = page.locator('tbody tr')

    await page.getByRole('button', { name: /^Ready/ }).click()
    await expect(rows).toHaveCount(2)

    await page.getByRole('button', { name: /^All \d/ }).click()
    await page.getByRole('button', { name: '# signed' }).click()
    await expect(rows).toHaveCount(1)
    await expect(rows).toContainText('nda.pdf')

    await page.getByRole('button', { name: 'All tags' }).click()
    await page.getByPlaceholder(/search/i).fill('invoice')
    await expect(rows).toHaveCount(1)
    await expect(rows).toContainText('invoice-march.pdf')

    await page.getByPlaceholder(/search/i).fill('nothing-matches')
    await expect(page.getByText('No documents found')).toBeVisible()
  })

  test('deletes a document after confirming', async ({ page }) => {
    const state = await mockApi(page, { documents: docs })
    await page.goto('/documents')

    page.once('dialog', (dialog) => dialog.accept())
    const row = page.locator('tbody tr').filter({ hasText: 'broken.docx' })
    await row.hover()
    await row.getByRole('button').click()

    await expect(page.locator('tbody tr')).toHaveCount(3)
    expect(state.documents.map((d) => d.id)).not.toContain('d3')
  })

  test('keeps the document when deletion is cancelled', async ({ page }) => {
    const state = await mockApi(page, { documents: docs })
    await page.goto('/documents')

    page.once('dialog', (dialog) => dialog.dismiss())
    const row = page.locator('tbody tr').filter({ hasText: 'broken.docx' })
    await row.hover()
    await row.getByRole('button').click()

    await expect(page.locator('tbody tr')).toHaveCount(4)
    expect(state.documents).toHaveLength(4)
  })

  test('dashboard shows onboarding for an empty workspace', async ({ page }) => {
    await mockApi(page)
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: /Upload a document/ })).toBeVisible()
  })
})
