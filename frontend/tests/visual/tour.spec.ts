import { test } from '@playwright/test'
import { mockApi, loginViaStorage, makeDocument } from '../e2e/mock-api'

const now = Date.now()
const OUT = process.env.SHOT_DIR ?? 'shots'

test.use({ viewport: { width: 1440, height: 900 }, video: { mode: 'on', size: { width: 1440, height: 900 } } })

test('tour', async ({ page }) => {
  const finishing = makeDocument({ id: 'd5', original_name: 'Informe_Auditoria_2026.docx', status: 'PROCESSING', chunk_count: null, created_at: new Date(now - 6e5).toISOString() })
  const rest = [
    makeDocument({ id: 'd1', original_name: 'Contrato_Proveedor_Q3.pdf', chunk_count: 38, created_at: new Date(now - 864e5).toISOString() }),
    makeDocument({ id: 'd3', original_name: 'Ventas_Q3_por_region.csv', mime_type: 'text/csv', chunk_count: 9 }),
    makeDocument({ id: 'd4', original_name: 'Politica_Privacidad.txt', mime_type: 'text/plain', status: 'ERROR', chunk_count: null }),
    makeDocument({ id: 'd6', original_name: 'Anexo_SLA.pdf', status: 'PROCESSING', chunk_count: null }),
  ]
  const rooms = [{ id: 'r1', workspace_id: 'ws1', name: 'Revisión legal Q3', document_ids: ['d1', 'd5'], created_by: 'u1', members: ['u1'], is_active: true, created_at: new Date(now - 72e5).toISOString() }]
  await mockApi(page, { rooms: rooms as never })
  let calls = 0
  await page.route('**/api/v1/documents', (r) => r.fulfill({ json: [calls++ < 1 ? finishing : { ...finishing, status: 'READY', chunk_count: 41, processed_at: new Date().toISOString() }, ...rest] }))
  const t = (m: number) => new Date(now - m * 60_000).toISOString()
  await page.route('**/api/v1/rooms/r1/messages*', (r) => r.fulfill({ json: [
    { id: 'm1', room_id: 'r1', author_id: 'u2', role: 'user', content: 'What is the termination notice period in the supplier contract?', sources: [], created_at: t(9) },
    { id: 'm2', room_id: 'r1', author_id: null, role: 'assistant', content: 'Either party may terminate with **60 days’ written notice**. Exiting within the first 12 months costs **two months of fees**.', created_at: t(8), sources: [
      { document_id: 'd1', document_name: 'Contrato_Proveedor_Q3.pdf', page: 14, score: 0.91, chunk_content: 'Either party may terminate this Agreement by giving sixty (60) days’ prior written notice.' },
      { document_id: 'd1', document_name: 'Contrato_Proveedor_Q3.pdf', page: 15, score: 0.87, chunk_content: 'Termination within the Initial Term shall incur a fee equal to two (2) months of Service Fees.' },
      { document_id: 'd5', document_name: 'Informe_Auditoria_2026.docx', page: null, score: 0.79, chunk_content: 'The definition of material breach is broad and may be contested. Risk: medium.' },
    ] },
  ] }))
  await page.route('**/api/v1/rooms/r1', (r) => r.fulfill({ json: rooms[0] }))
  await loginViaStorage(page)

  await page.goto('/dashboard')
  await page.waitForTimeout(1500)
  // A document finishes: it reranks to the top and holds yellow.
  await page.getByRole('link', { name: 'Documents', exact: true }).first().click()
  await page.waitForTimeout(900)
  await page.getByRole('link', { name: 'DocuMind, go to dashboard' }).click()
  await page.waitForTimeout(2200)
  await page.getByRole('button', { name: /Account menu/ }).click()
  await page.waitForTimeout(1000)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Notifications' }).click()
  await page.waitForTimeout(1100)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  await page.getByRole('link', { name: 'Chat Rooms', exact: true }).first().click()
  await page.waitForTimeout(900)
  await page.getByRole('link', { name: 'Revisión legal Q3' }).first().click()
  await page.waitForTimeout(1200)
  for (const s of ['S2', 'S3', 'S1']) {
    await page.getByRole('button', { name: s, exact: true }).click()
    await page.waitForTimeout(800)
  }
  await page.getByRole('button', { name: /dark theme/ }).click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}/tour-end.png` })
})
