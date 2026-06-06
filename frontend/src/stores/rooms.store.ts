import { defineStore } from 'pinia'
import { ref } from 'vue'
import { roomsService } from '@/services/rooms.service'
import type { ConnectedUser, Message, Room } from '@/types/room'
import { useAuthStore } from './auth.store'

export const useRoomsStore = defineStore('rooms', () => {
  const rooms = ref<Room[]>([])
  const activeRoom = ref<Room | null>(null)
  const messages = ref<Message[]>([])
  const connectedUsers = ref<ConnectedUser[]>([])
  const isAiTyping = ref(false)
  const aiStreamBuffer = ref('')

  let ws: WebSocket | null = null

  async function fetchRooms() {
    rooms.value = await roomsService.list()
  }

  async function fetchMessages(roomId: string) {
    messages.value = await roomsService.getMessages(roomId)
  }

  async function loadMoreMessages(roomId: string) {
    if (!messages.value.length) return
    const beforeId = messages.value[0].id
    const older = await roomsService.getMessages(roomId, beforeId)
    messages.value = [...older, ...messages.value]
  }

  function connectWebSocket(roomId: string) {
    const authStore = useAuthStore()
    const wsBase = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
    const token = authStore.accessToken

    ws = new WebSocket(`${wsBase}/ws/room/${roomId}?token=${token}`)

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      _handleWsEvent(payload)
    }

    ws.onclose = () => {
      // Reconnect after 3s on unexpected close
      setTimeout(() => connectWebSocket(roomId), 3000)
    }
  }

  function _handleWsEvent(payload: Record<string, unknown>) {
    switch (payload.type) {
      case 'user_joined':
        connectedUsers.value.push(payload.user as ConnectedUser)
        break
      case 'user_left':
        connectedUsers.value = connectedUsers.value.filter((u) => u.id !== payload.user_id)
        break
      case 'user_message': {
        const msg: Message = {
          id: payload.message_id as string,
          room_id: activeRoom.value?.id ?? '',
          author_id: payload.user_id as string,
          role: 'user',
          content: payload.content as string,
          sources: [],
          created_at: new Date().toISOString(),
        }
        messages.value.push(msg)
        break
      }
      case 'ai_stream':
        if (!isAiTyping.value) isAiTyping.value = true
        aiStreamBuffer.value += payload.token as string
        break
      case 'ai_stream_end': {
        isAiTyping.value = false
        const aiMsg: Message = {
          id: payload.message_id as string,
          room_id: activeRoom.value?.id ?? '',
          author_id: null,
          role: 'assistant',
          content: aiStreamBuffer.value,
          sources: (payload.sources as Message['sources']) ?? [],
          created_at: new Date().toISOString(),
        }
        messages.value.push(aiMsg)
        aiStreamBuffer.value = ''
        break
      }
    }
  }

  function sendMessage(content: string) {
    ws?.send(JSON.stringify({ type: 'user_message', content }))
  }

  function sendTypingStart() {
    ws?.send(JSON.stringify({ type: 'typing_start' }))
  }

  function sendTypingStop() {
    ws?.send(JSON.stringify({ type: 'typing_stop' }))
  }

  function disconnect() {
    ws?.close()
    ws = null
    connectedUsers.value = []
    aiStreamBuffer.value = ''
    isAiTyping.value = false
  }

  return {
    rooms, activeRoom, messages, connectedUsers, isAiTyping, aiStreamBuffer,
    fetchRooms, fetchMessages, loadMoreMessages,
    connectWebSocket, sendMessage, sendTypingStart, sendTypingStop, disconnect,
  }
})
