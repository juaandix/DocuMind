import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'

vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import api from '@/services/api'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('isAuthenticated returns false when no token', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated()).toBe(false)
  })

  it('isAuthenticated returns true when token exists', () => {
    localStorage.setItem('access_token', 'fake-token')
    const store = useAuthStore()
    expect(store.isAuthenticated()).toBe(true)
  })

  it('login stores tokens and sets user', async () => {
    const mockTokens = { access_token: 'acc-token', refresh_token: 'ref-token' }
    const mockUser = { id: '1', email: 'test@example.com', full_name: 'Test', role: 'OWNER', workspace_id: 'ws1' }

    vi.mocked(api.post).mockResolvedValueOnce({ data: mockTokens })
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockUser })

    const store = useAuthStore()
    await store.login('test@example.com', 'password')

    expect(localStorage.getItem('access_token')).toBe('acc-token')
    expect(localStorage.getItem('refresh_token')).toBe('ref-token')
    expect(store.user?.email).toBe('test@example.com')
  })

  it('logout clears tokens and user', async () => {
    localStorage.setItem('access_token', 'token')
    localStorage.setItem('refresh_token', 'rtoken')
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} })

    const store = useAuthStore()
    store.user = { id: '1', email: 'a@b.com', full_name: 'A', role: 'OWNER', workspace_id: 'ws1', avatar_url: null }
    await store.logout()

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(store.user).toBeNull()
  })

  it('fetchMe sets user from API', async () => {
    const mockUser = { id: '1', email: 'me@example.com', full_name: 'Me', role: 'MEMBER', workspace_id: 'ws1', avatar_url: null }
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockUser })

    const store = useAuthStore()
    await store.fetchMe()

    expect(store.user?.email).toBe('me@example.com')
  })
})
