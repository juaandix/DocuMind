export type DocumentStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'ERROR'

export interface Document {
  id: string
  workspace_id: string
  uploaded_by: string
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  status: DocumentStatus
  error_message: string | null
  page_count: number | null
  chunk_count: number | null
  tags: string[]
  created_at: string
  processed_at: string | null
}
