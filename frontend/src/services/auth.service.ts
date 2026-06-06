import api from './api'
import type { TokenResponse, User } from '@/types/user'

export const authService = {
  async register(payload: {
    email: string
    password: string
    full_name: string
    workspace_name: string
  }): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/api/v1/auth/register', payload)
    return data
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/api/v1/auth/login', { email, password })
    return data
  },

  async refresh(refreshToken: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    })
    return data
  },

  async logout(): Promise<void> {
    await api.post('/api/v1/auth/logout')
  },

  async me(): Promise<User> {
    const { data } = await api.get<User>('/api/v1/auth/me')
    return data
  },
}
