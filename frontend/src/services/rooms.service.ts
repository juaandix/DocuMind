import api from './api'
import type { Message, Room } from '@/types/room'

export const roomsService = {
  async list(): Promise<Room[]> {
    const { data } = await api.get<Room[]>('/api/v1/rooms')
    return data
  },

  async create(name: string, documentIds: string[]): Promise<Room> {
    const { data } = await api.post<Room>('/api/v1/rooms', { name, document_ids: documentIds })
    return data
  },

  async get(roomId: string): Promise<Room> {
    const { data } = await api.get<Room>(`/api/v1/rooms/${roomId}`)
    return data
  },

  async update(roomId: string, payload: { name?: string; document_ids?: string[] }): Promise<Room> {
    const { data } = await api.patch<Room>(`/api/v1/rooms/${roomId}`, payload)
    return data
  },

  async delete(roomId: string): Promise<void> {
    await api.delete(`/api/v1/rooms/${roomId}`)
  },

  async getMessages(roomId: string, beforeId?: string, limit = 30): Promise<Message[]> {
    const { data } = await api.get<Message[]>(`/api/v1/rooms/${roomId}/messages`, {
      params: { before_id: beforeId, limit },
    })
    return data
  },

  async exportPdf(roomId: string): Promise<{ task_id: string }> {
    const { data } = await api.post(`/api/v1/rooms/${roomId}/export`)
    return data
  },
}
