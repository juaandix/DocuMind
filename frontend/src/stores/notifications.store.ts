import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import type { Notification } from '@/types/notification'

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<Notification[]>([])
  const unread = ref(0)

  let ws: WebSocket | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null

  async function fetchAll() {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get<Notification[]>('/notifications/'),
        api.get<{ count: number }>('/notifications/unread-count'),
      ])
      items.value = listRes.data
      unread.value = countRes.data.count
    } catch {
      // notification service may be offline in dev
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all')
      items.value.forEach((n) => (n.read = true))
      unread.value = 0
    } catch {
      // ignore
    }
  }

  function connectWs() {
    const token = localStorage.getItem('access_token')
    if (!token) return
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    ws = new WebSocket(`${proto}//${location.host}/ws/workspace?token=${token}`)

    ws.onmessage = () => {
      // Any workspace event (document_ready, document_error, export_ready) → refresh
      setTimeout(fetchAll, 1500)
    }

    ws.onclose = () => {
      setTimeout(connectWs, 5000)
    }
  }

  function init() {
    fetchAll()
    connectWs()
    pollTimer = setInterval(fetchAll, 30_000)
  }

  function cleanup() {
    if (ws) {
      ws.close()
      ws = null
    }
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return { items, unread, init, cleanup, fetchAll, markAllRead }
})
