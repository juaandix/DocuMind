import { defineStore } from 'pinia'
import { ref } from 'vue'
import { documentsService } from '@/services/documents.service'
import type { Document } from '@/types/document'

export const useDocumentsStore = defineStore('documents', () => {
  const documents = ref<Document[]>([])
  const uploadProgress = ref<Record<string, number>>({})

  async function fetchDocuments() {
    documents.value = await documentsService.list()
  }

  async function upload(file: File): Promise<Document> {
    const tempId = `uploading-${Date.now()}`
    uploadProgress.value[tempId] = 0

    const doc = await documentsService.upload(file, (pct) => {
      uploadProgress.value[tempId] = pct
    })

    delete uploadProgress.value[tempId]
    documents.value.unshift(doc)
    return doc
  }

  async function pollStatus(docId: string): Promise<void> {
    const interval = setInterval(async () => {
      const { status, chunk_count } = await documentsService.getStatus(docId)
      const idx = documents.value.findIndex((d) => d.id === docId)
      if (idx >= 0) {
        documents.value[idx] = { ...documents.value[idx], status: status as Document['status'], chunk_count }
      }
      if (status === 'READY' || status === 'ERROR') {
        clearInterval(interval)
      }
    }, 3000)
  }

  async function removeDocument(docId: string) {
    await documentsService.delete(docId)
    documents.value = documents.value.filter((d) => d.id !== docId)
  }

  return { documents, uploadProgress, fetchDocuments, upload, pollStatus, removeDocument }
})
