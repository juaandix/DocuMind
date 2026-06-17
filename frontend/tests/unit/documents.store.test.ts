import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDocumentsStore } from '@/stores/documents.store'

vi.mock('@/services/documents.service', () => ({
  documentsService: {
    list: vi.fn(),
    upload: vi.fn(),
    getStatus: vi.fn(),
    delete: vi.fn(),
    updateTags: vi.fn(),
  },
}))

import { documentsService } from '@/services/documents.service'

const mockDoc = {
  id: 'doc1',
  filename: 'test.txt',
  original_name: 'test.txt',
  mime_type: 'text/plain',
  size_bytes: 100,
  status: 'UPLOADING' as const,
  tags: [],
  chunk_count: null,
  page_count: null,
  error_message: null,
  created_at: new Date().toISOString(),
  processed_at: null,
  workspace_id: 'ws1',
  uploaded_by: 'user1',
  s3_key: 'documents/uuid/test.txt',
}

describe('useDocumentsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchDocuments populates store', async () => {
    vi.mocked(documentsService.list).mockResolvedValue([mockDoc])

    const store = useDocumentsStore()
    await store.fetchDocuments()

    expect(store.documents).toHaveLength(1)
    expect(store.documents[0].id).toBe('doc1')
  })

  it('upload prepends document to list', async () => {
    vi.mocked(documentsService.upload).mockResolvedValue(mockDoc)

    const store = useDocumentsStore()
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const doc = await store.upload(file)

    expect(doc.id).toBe('doc1')
    expect(store.documents[0].id).toBe('doc1')
  })

  it('upload calls onProgress callback', async () => {
    let capturedCallback: ((pct: number) => void) | undefined
    vi.mocked(documentsService.upload).mockImplementation((_f, cb) => {
      capturedCallback = cb
      cb?.(50)
      return Promise.resolve(mockDoc)
    })

    const store = useDocumentsStore()
    const file = new File(['x'], 'f.txt', { type: 'text/plain' })
    const progress: number[] = []
    await store.upload(file, (pct) => progress.push(pct))

    expect(progress).toContain(50)
  })

  it('removeDocument deletes and removes from list', async () => {
    vi.mocked(documentsService.list).mockResolvedValue([mockDoc])
    vi.mocked(documentsService.delete).mockResolvedValue(undefined)

    const store = useDocumentsStore()
    await store.fetchDocuments()
    await store.removeDocument('doc1')

    expect(store.documents).toHaveLength(0)
    expect(documentsService.delete).toHaveBeenCalledWith('doc1')
  })

  it('pollStatus updates document status to READY', async () => {
    vi.mocked(documentsService.list).mockResolvedValue([mockDoc])
    vi.mocked(documentsService.getStatus)
      .mockResolvedValueOnce({ status: 'PROCESSING', chunk_count: null })
      .mockResolvedValueOnce({ status: 'READY', chunk_count: 42 })

    vi.useFakeTimers()
    const store = useDocumentsStore()
    await store.fetchDocuments()
    store.pollStatus('doc1')

    await vi.advanceTimersByTimeAsync(3000)
    expect(store.documents[0].status).toBe('PROCESSING')

    await vi.advanceTimersByTimeAsync(3000)
    expect(store.documents[0].status).toBe('READY')
    expect(store.documents[0].chunk_count).toBe(42)

    vi.useRealTimers()
  })
})
