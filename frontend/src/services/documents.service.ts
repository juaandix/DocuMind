import api from './api'
import type { Document } from '@/types/document'

export const documentsService = {
  async list(params?: { status?: string; tag?: string; skip?: number; limit?: number }): Promise<Document[]> {
    const { data } = await api.get<Document[]>('/api/v1/documents', { params })
    return data
  },

  async upload(file: File, onProgress?: (pct: number) => void): Promise<Document> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<Document>('/api/v1/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100))
      },
    })
    return data
  },

  async get(docId: string): Promise<Document> {
    const { data } = await api.get<Document>(`/api/v1/documents/${docId}`)
    return data
  },

  async getStatus(docId: string): Promise<{ status: string; chunk_count: number | null }> {
    const { data } = await api.get(`/api/v1/documents/${docId}/status`)
    return data
  },

  async updateTags(docId: string, tags: string[]): Promise<Document> {
    const { data } = await api.patch<Document>(`/api/v1/documents/${docId}/tags`, { tags })
    return data
  },

  async delete(docId: string): Promise<void> {
    await api.delete(`/api/v1/documents/${docId}`)
  },
}
