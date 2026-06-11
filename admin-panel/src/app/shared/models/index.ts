export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface Workspace {
  id: string
  name: string
  plan: 'FREE' | 'PRO'
  status: 'ACTIVE' | 'SUSPENDED'
  owner_email: string
  member_count: number
  document_count: number
  storage_bytes: number
  created_at: string
}

export interface GlobalUser {
  id: string
  email: string
  full_name: string
  workspace_id: string
  workspace_name: string
  role: string
  is_active: boolean
  last_login: string | null
  created_at: string
}

export interface PlatformStats {
  total_workspaces: number
  active_workspaces: number
  total_users: number
  total_documents: number
  documents_processed_today: number
  storage_total_bytes: number
  celery_jobs_pending: number
  celery_jobs_failed_today: number
}

export interface CeleryJob {
  id: string
  task_name: string
  status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE'
  document_id: string | null
  workspace_id: string
  started_at: string | null
  finished_at: string | null
  duration_seconds: number | null
  error: string | null
}

export interface AdminNotification {
  id: string
  user_id: string
  user_email: string
  type: string
  title: string
  read: boolean
  email_sent: boolean
  created_at: string
}
