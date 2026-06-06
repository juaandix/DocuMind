import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authService } from '@/services/auth.service'
import type { User } from '@/types/user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))

  async function login(email: string, password: string) {
    const tokens = await authService.login(email, password)
    accessToken.value = tokens.access_token
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    user.value = await authService.me()
  }

  async function register(payload: {
    email: string
    password: string
    full_name: string
    workspace_name: string
  }) {
    const tokens = await authService.register(payload)
    accessToken.value = tokens.access_token
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    user.value = await authService.me()
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      accessToken.value = null
      user.value = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  async function fetchMe() {
    if (!accessToken.value) return
    user.value = await authService.me()
  }

  const isAuthenticated = () => !!accessToken.value

  return { user, accessToken, login, register, logout, fetchMe, isAuthenticated }
})
