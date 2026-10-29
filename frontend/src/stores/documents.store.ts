import { defineStore } from 'pinia'
import { ref } from 'vue'
import { documentsService } from '@/services/documents.service'
import type { Document, DocumentStatus } from '@/types/document'

const IN_PROGRESS: DocumentStatus[] = ['UPLOADING', 'PROCESSING']

export const useDocumentsStore = defineStore('documents', () => {
  const documents = ref<Document[]>([])
  const uploadProgress = ref<Record<string, number>>({})
  // Documents that finished processing (READY or ERROR) while the user was
  // here; they stay highlighted until acknowledged.
  const changedIds = ref<Set<string>>(new Set())

  function trackTransition(id: string, from: DocumentStatus | undefined, to: DocumentStatus) {
    if (from && IN_PROGRESS.includes(from) && !IN_PROGRESS.includes(to)) {
      changedIds.value = new Set(changedIds.value).add(id)
    }
  }

  async function fetchDocuments() {
    const previous = new Map(documents.value.map((d) => [d.id, d.status]))
    const next = await documentsService.list()
    next.forEach((d) => trackTransition(d.id, previous.get(d.id), d.status))
    documents.value = next
  }

  async function upload(file: File, onProgress?: (pct: number) => void): Promise<Document> {
    const doc = await documentsService.upload(file, onProgress)
    documents.value.unshift(doc)
    return doc
  }

  async function pollStatus(docId: string): Promise<void> {
    const interval = setInterval(async () => {
      const { status, chunk_count } = await documentsService.getStatus(docId)
      const idx = documents.value.findIndex((d) => d.id === docId)
      if (idx >= 0) {
        trackTransition(docId, documents.value[idx].status, status as DocumentStatus)
        documents.value[idx] = { ...documents.value[idx], status: status as Document['status'], chunk_count }
      }
      if (status === 'READY' || status === 'ERROR') {
        clearInterval(interval)
      }
    }, 3000)
  }

  function acknowledge(docId: string) {
    if (!changedIds.value.has(docId)) return
    const next = new Set(changedIds.value)
    next.delete(docId)
    changedIds.value = next
  }

  async function removeDocument(docId: string) {
    await documentsService.delete(docId)
    documents.value = documents.value.filter((d) => d.id !== docId)
    acknowledge(docId)
  }

  return { documents, uploadProgress, changedIds, fetchDocuments, upload, pollStatus, acknowledge, removeDocument }
})
