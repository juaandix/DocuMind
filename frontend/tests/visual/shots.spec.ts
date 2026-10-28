import { test } from '@playwright/test'
import { mockApi, loginViaStorage, makeDocument } from '../e2e/mock-api'

const OUT = process.env.SHOT_DIR ?? 'shots'
const now = Date.now()
const docs = [
  makeDocument({ id: 'd1', original_name: 'Contrato_Proveedor_Q3.pdf', size_bytes: 2_400_000, chunk_count: 38, created_at: new Date(now - 864e5).toISOString() }),
  makeDocument({ id: 'd2', original_name: 'Informe_Auditoria_2026.docx', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', status: 'PROCESSING', chunk_count: null, size_bytes: 860_000 }),
  makeDocument({ id: 'd3', original_name: 'Ventas_Q3_por_region.csv', mime_type: 'text/csv', size_bytes: 48_000, chunk_count: 9 }),
  makeDocument({ id: 'd4', original_name: 'Politica_Privacidad.txt', mime_type: 'text/plain', status: 'ERROR', chunk_count: null, error_message: 'Could not extract text' }),
]
const rooms = [
  { id: 'r1', workspace_id: 'ws1', name: 'Revisión legal Q3', document_ids: ['d1', 'd2'], created_by: 'u1', members: ['u1'], is_active: true, created_at: new Date(now - 72e5).toISOString() },
  { id: 'r2', workspace_id: 'ws1', name: 'Ventas por región', document_ids: ['d3'], created_by: 'u1', members: ['u1'], is_active: true, created_at: new Date(now - 864e5 * 2).toISOString() },
]
const t = (m: number) => new Date(now - m * 60_000).toISOString()
const messages = [
  { id: 'm1', room_id: 'r1', author_id: 'u2', role: 'user', content: 'What is the termination notice period in the supplier contract, and are there penalties for early exit?', sources: [], created_at: t(9) },
  { id: 'm2', room_id: 'r1', author_id: null, role: 'assistant', content: 'Either party may terminate with **60 days’ written notice**. Exiting within the first 12 months costs **two months of fees**, unless the supplier is in documented breach.\n\nThe 2026 audit rates this clause medium risk because the definition of material breach is broad.', created_at: t(8), sources: [
    { document_id: 'd1', document_name: 'Contrato_Proveedor_Q3.pdf', page: 14, score: 0.91, chunk_content: 'Either party may terminate this Agreement by giving sixty (60) days’ prior written notice to the other party, delivered to the addresses in Annex A.' },
    { document_id: 'd1', document_name: 'Contrato_Proveedor_Q3.pdf', page: 15, score: 0.87, chunk_content: 'Termination within the Initial Term shall incur a fee equal to two (2) months of Service Fees, save for material breach by the Supplier.' },
    { document_id: 'd2', document_name: 'Informe_Auditoria_2026.docx', page: null, score: 0.79, chunk_content: 'Finding 7. The definition of material breach in §9.4 is broad and may be contested. Risk: medium.' },
  ] },
  { id: 'm3', room_id: 'r1', author_id: 'u1', role: 'user', content: 'Draft a short note for the client explaining this.', sources: [], created_at: t(2) },
]

const pages = (process.env.SHOT_PAGES ?? '/dashboard').split(',')

for (const theme of ['light', 'dark']) {
  for (const vp of [{ n: 'desktop', width: 1440, height: 900 }, { n: 'mobile', width: 390, height: 844 }]) {
    for (const path of pages) {
      test(`${theme} ${vp.n} ${path}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await mockApi(page, { documents: docs, rooms: rooms as never })
        await page.route('**/api/v1/rooms/r1/messages*', (r) => r.fulfill({ json: messages }))
        await page.route('**/api/v1/rooms/r1', (r) => r.fulfill({ json: rooms[0] }))
        await page.route('**/api/v1/documents/d1', (r) => r.fulfill({ json: docs[0] }))
        await page.route('**/api/v1/workspace/members', (r) => r.fulfill({ json: [
          { id: 'u1', email: 'ana@example.com', full_name: 'Ana García', role: 'OWNER', avatar_url: null, workspace_id: 'ws1' },
          { id: 'u2', email: 'maria@example.com', full_name: 'María López', role: 'ADMIN', avatar_url: null, workspace_id: 'ws1' },
          { id: 'u3', email: 'jorge@example.com', full_name: 'Jorge Ruiz', role: 'MEMBER', avatar_url: null, workspace_id: 'ws1' },
        ] }))
        await loginViaStorage(page)
        await page.addInitScript((t) => localStorage.setItem('theme', t), theme)
        if (['/login', '/register'].includes(path)) {
          await page.evaluate(() => localStorage.clear()).catch(() => {})
        }
        if (path === '/dashboard') {
          // Show the signature state: a document finishes between two fetches.
          let calls = 0
          const finishing = makeDocument({ id: 'd5', original_name: 'Informe_Auditoria_2026.docx', status: 'PROCESSING', chunk_count: null, created_at: new Date(now - 6e5).toISOString() })
          await page.route('**/api/v1/documents', (r) => r.fulfill({ json: [
            calls++ === 0 ? finishing : { ...finishing, status: 'READY', chunk_count: 41, processed_at: new Date(now - 6e4).toISOString() },
            ...docs.filter((d) => d.id !== 'd2'),
            makeDocument({ id: 'd6', original_name: 'Anexo_SLA.pdf', status: 'PROCESSING', chunk_count: null }),
          ] }))
          await page.goto('/documents')
          await page.waitForLoadState('networkidle')
          await page.getByRole('link', { name: 'DocuMind, go to dashboard' }).click()
        } else {
          await page.goto(path)
        }
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(300)
        const slug = path.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'root'
        await page.screenshot({ path: `${OUT}/${slug}-${theme}-${vp.n}.png`, fullPage: true })
      })
    }
  }
}
