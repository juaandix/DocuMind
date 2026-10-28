import { test } from '@playwright/test'
import { mockApi, loginViaStorage, makeDocument } from '../e2e/mock-api'

// Portfolio screenshots: 1440x900 viewport, Spanish UI, sample data (not real customers).
const OUT = process.env.SHOT_DIR ?? 'shots'
const now = Date.now()
const ago = (m: number) => new Date(now - m * 60_000).toISOString()
const pdf = 'application/pdf'
const docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const finishing = makeDocument({ id: 'd2', original_name: 'Informe_Auditoria_2026.docx', mime_type: docx, status: 'PROCESSING', chunk_count: null, size_bytes: 860_000, created_at: ago(14) })
const docs = [
  makeDocument({ id: 'd1', original_name: 'Contrato_Proveedor_Q3.pdf', mime_type: pdf, chunk_count: 38, page_count: 24, size_bytes: 2_400_000, created_at: ago(60 * 26), tags: ['legal', 'proveedores'], processed_at: ago(60 * 26 - 2) }),
  makeDocument({ id: 'd3', original_name: 'Ventas_Q3_por_region.csv', mime_type: 'text/csv', chunk_count: 9, page_count: null, size_bytes: 48_000, created_at: ago(60 * 50), tags: ['ventas'] }),
  makeDocument({ id: 'd4', original_name: 'Manual_Onboarding_v4.pdf', mime_type: pdf, chunk_count: 112, page_count: 61, size_bytes: 5_100_000, created_at: ago(60 * 80), tags: ['rrhh'] }),
  makeDocument({ id: 'd5', original_name: 'Politica_Privacidad.txt', mime_type: 'text/plain', status: 'ERROR', chunk_count: null, page_count: null, size_bytes: 48_000, created_at: ago(60 * 100), error_message: 'No se pudo extraer texto del archivo' }),
  makeDocument({ id: 'd6', original_name: 'Anexo_SLA.pdf', mime_type: pdf, status: 'PROCESSING', chunk_count: null, size_bytes: 310_000, created_at: ago(5) }),
  makeDocument({ id: 'd7', original_name: 'Roadmap_Producto_H2.pdf', mime_type: pdf, chunk_count: 21, page_count: 12, size_bytes: 1_200_000, created_at: ago(60 * 140), tags: ['producto'] }),
]
const rooms = [
  { id: 'r1', workspace_id: 'ws1', name: 'Revisión legal Q3', document_ids: ['d1', 'd2'], created_by: 'u1', members: ['u1', 'u2'], is_active: true, created_at: ago(120) },
  { id: 'r2', workspace_id: 'ws1', name: 'Ventas por región', document_ids: ['d3'], created_by: 'u1', members: ['u1'], is_active: true, created_at: ago(60 * 30) },
  { id: 'r3', workspace_id: 'ws1', name: 'Onboarding equipo', document_ids: ['d4', 'd7'], created_by: 'u2', members: ['u1', 'u2'], is_active: true, created_at: ago(60 * 70) },
]
const messages = [
  { id: 'm1', room_id: 'r1', author_id: 'u2', role: 'user', content: '¿Cuál es el plazo de preaviso para rescindir el contrato del proveedor? ¿Hay penalización por salir antes?', sources: [], created_at: ago(9) },
  { id: 'm2', room_id: 'r1', author_id: null, role: 'assistant', created_at: ago(8), content: 'Cualquiera de las partes puede rescindir con **60 días de preaviso por escrito**. Si la salida se produce durante los primeros 12 meses, se aplica una penalización de **dos meses de cuota**, salvo incumplimiento documentado del proveedor.\n\nLa auditoría de 2026 califica esta cláusula de riesgo medio porque la definición de incumplimiento es amplia.', sources: [
    { document_id: 'd1', document_name: 'Contrato_Proveedor_Q3.pdf', page: 14, score: 0.91, chunk_content: 'Cualquiera de las partes podrá resolver el presente Contrato mediante preaviso por escrito con una antelación mínima de sesenta (60) días.' },
    { document_id: 'd1', document_name: 'Contrato_Proveedor_Q3.pdf', page: 15, score: 0.87, chunk_content: 'La resolución durante el Plazo Inicial conllevará una penalización equivalente a dos (2) mensualidades, salvo incumplimiento grave del Proveedor.' },
    { document_id: 'd2', document_name: 'Informe_Auditoria_2026.docx', page: null, score: 0.79, chunk_content: 'Hallazgo 7. La definición de incumplimiento grave de la cláusula 9.4 es amplia y podría ser discutida. Riesgo: medio.' },
  ] },
  { id: 'm3', room_id: 'r1', author_id: 'u1', role: 'user', content: 'Redacta una nota breve para el cliente explicándolo.', sources: [], created_at: ago(2) },
]
const members = [
  { id: 'u1', email: 'ana@acme.example', full_name: 'Ana García', role: 'OWNER', avatar_url: null, workspace_id: 'ws1' },
  { id: 'u2', email: 'maria@acme.example', full_name: 'María López', role: 'ADMIN', avatar_url: null, workspace_id: 'ws1' },
  { id: 'u3', email: 'jorge@acme.example', full_name: 'Jorge Ruiz', role: 'MEMBER', avatar_url: null, workspace_id: 'ws1' },
  { id: 'u4', email: 'lucia@acme.example', full_name: 'Lucía Martín', role: 'MEMBER', avatar_url: null, workspace_id: 'ws1' },
]
const notifications = [
  { _id: 'n1', type: 'document_ready', title: 'Contrato_Proveedor_Q3.pdf está listo', body: '38 fragmentos indexados', read: false, created_at: ago(40), metadata: {} },
  { _id: 'n2', type: 'workspace_invite', title: 'Lucía Martín se ha unido', body: 'Rol: miembro', read: true, created_at: ago(60 * 5), metadata: {} },
  { _id: 'n3', type: 'document_error', title: 'Error al procesar Politica_Privacidad.txt', body: 'No se pudo extraer texto del archivo', read: true, created_at: ago(60 * 26), metadata: {} },
]

const shots: { name: string; path: string; theme?: 'dark'; changed?: boolean; after?: (p: import('@playwright/test').Page) => Promise<void> }[] = [
  { name: '02_dashboard', path: '/dashboard', changed: true },
  { name: '04_documents', path: '/documents' },
  { name: '05_documents_filtered', path: '/documents?q=contrato' },
  { name: '06_document_detail', path: '/documents/d1' },
  { name: '07c_room_engineering', path: '/rooms/r1', after: async (p) => { await p.getByRole('button', { name: 'S2', exact: true }).click(); await p.waitForTimeout(500) } },
  { name: '07d_room_dark', path: '/rooms/r1', theme: 'dark' },
  { name: '06_rooms_list', path: '/rooms' },
  { name: '09_members', path: '/settings/members' },
  { name: '01_login', path: '/login' },
  { name: '02b_dashboard_dark', path: '/dashboard', theme: 'dark', changed: true },
]

for (const s of shots) {
  test(`portfolio ${s.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await mockApi(page, { rooms: rooms as never })
    let calls = 0
    await page.route('**/api/v1/documents', (r) => r.fulfill({ json: [
      s.changed && calls++ > 0 ? { ...finishing, status: 'READY', chunk_count: 41, processed_at: ago(1) } : finishing, ...docs] }))
    await page.route('**/api/v1/documents/d1', (r) => r.fulfill({ json: docs[0] }))
    await page.route('**/api/v1/rooms/r1/messages*', (r) => r.fulfill({ json: messages }))
    await page.route('**/api/v1/rooms/r1', (r) => r.fulfill({ json: rooms[0] }))
    await page.route('**/api/v1/workspace/members', (r) => r.fulfill({ json: members }))
    await page.route('**/notifications/**', (r) => r.request().url().includes('unread-count') ? r.fulfill({ json: { count: 1 } }) : r.fulfill({ json: notifications }))
    await page.route('**/api/v1/auth/me', (r) => r.fulfill({ json: { ...members[0], email: 'ana@acme.example' } }))
    await page.route('**/api/v1/workspace/', (r) => r.fulfill({ json: { id: 'ws1', name: 'Acme Legal', slug: 'acme-legal', plan: 'PRO', storage_used_bytes: 3.1 * 1024 ** 3, storage_limit_bytes: 5 * 1024 ** 3, created_at: ago(60 * 24 * 60) } }))
    if (s.path !== '/login') await loginViaStorage(page)
    await page.addInitScript(([t]) => { localStorage.setItem('locale', 'es'); localStorage.setItem('theme', t) }, [s.theme ?? 'light'])
    if (s.changed) {
      await page.goto('/documents')
      await page.waitForLoadState('networkidle')
      await page.locator('header a[href="/dashboard"]').first().click()
    } else {
      await page.goto(s.path)
    }
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    if (s.after) await s.after(page)
    await page.screenshot({ path: `${OUT}/${s.name}.png` })
  })
}
