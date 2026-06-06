export interface Room {
  id: string
  workspace_id: string
  name: string
  document_ids: string[]
  created_by: string
  members: string[]
  is_active: boolean
  created_at: string
}

export type MessageRole = 'user' | 'assistant' | 'system'

export interface MessageSource {
  document_id: string
  document_name: string
  chunk_content: string
  page: number | null
  score: number
}

export interface Message {
  id: string
  room_id: string
  author_id: string | null
  role: MessageRole
  content: string
  sources: MessageSource[]
  created_at: string
}

export interface ConnectedUser {
  id: string
  name: string
}
