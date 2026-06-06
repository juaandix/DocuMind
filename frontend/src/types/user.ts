export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  workspace_id: string | null
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}
