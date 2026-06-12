export type NotificationType =
  | 'document_ready'
  | 'document_error'
  | 'workspace_invite'
  | 'export_ready'
  | 'storage_warning'

export interface Notification {
  _id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  created_at: string
  metadata: {
    document_id?: string | null
    room_id?: string | null
    invite_token?: string | null
  }
}
