import type { Page, Route } from '@playwright/test'
import type { Document } from '../../src/types/document'
import type { Room } from '../../src/types/room'
import type { User } from '../../src/types/user'

export const user: User = {
  id: 'u1',
  email: 'ana@example.com',
  full_name: 'Ana García',
  role: 'OWNER',
  avatar_url: null,
  workspace_id: 'ws1',
}

export const workspace = {
  id: 'ws1',
  name: 'Acme Legal',
  slug: 'acme-legal',
  plan: 'FREE',
  storage_used_bytes: 256 * 1024 * 1024,
  storage_limit_bytes: 1024 * 1024 * 1024,
  created_at: '2026-09-01T10:00:00Z',
}

export function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'd1',
    workspace_id: 'ws1',
    uploaded_by: 'u1',
    filename: 'contract.pdf',
    original_name: 'contract.pdf',
    mime_type: 'application/pdf',
    size_bytes: 200 * 1024,
    status: 'READY',
    error_message: null,
    page_count: 4,
    chunk_count: 12,
    tags: [],
    created_at: '2026-10-01T10:00:00Z',
    processed_at: '2026-10-01T10:01:00Z',
    ...overrides,
  }
}

export interface MockState {
  documents: Document[]
  rooms: Room[]
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

/**
 * Stub every backend call the app makes. Returns the mutable state so tests can
 * assert on it (e.g. a DELETE removed a document).
 */
export async function mockApi(page: Page, initial: Partial<MockState> = {}): Promise<MockState> {
  const state: MockState = { documents: [], rooms: [], ...initial }

  // WebSockets (workspace notifications, rooms): accept and stay silent
  await page.routeWebSocket(/\/ws\//, () => {})

  await page.route('**/notifications/**', (route) =>
    route.request().url().includes('unread-count') ? json(route, { count: 0 }) : json(route, []),
  )

  await page.route('**/api/v1/**', (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const method = req.method()

    if (pathname === '/api/v1/auth/login') {
      const body = req.postDataJSON() as { email: string; password: string }
      if (body.password !== 'correct-password') return json(route, { detail: 'Incorrect email or password' }, 401)
      return json(route, { access_token: 'access-1', refresh_token: 'refresh-1', token_type: 'bearer' })
    }
    if (pathname === '/api/v1/auth/register') {
      return json(route, { access_token: 'access-1', refresh_token: 'refresh-1', token_type: 'bearer' }, 201)
    }
    if (pathname === '/api/v1/auth/me') return json(route, user)
    if (pathname === '/api/v1/auth/logout') return json(route, {})
    if (pathname === '/api/v1/workspace/') return json(route, workspace)
    if (pathname === '/api/v1/rooms') return json(route, state.rooms)
    if (pathname === '/api/v1/documents') return json(route, state.documents)

    const docMatch = pathname.match(/^\/api\/v1\/documents\/([^/]+)$/)
    if (docMatch && method === 'DELETE') {
      state.documents = state.documents.filter((d) => d.id !== docMatch[1])
      return route.fulfill({ status: 204 })
    }

    return json(route, { detail: `Unmocked ${method} ${pathname}` }, 501)
  })

  return state
}

/** Start the page already logged in (tokens in localStorage before the app boots). */
export async function loginViaStorage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'access-1')
    localStorage.setItem('refresh_token', 'refresh-1')
  })
}
