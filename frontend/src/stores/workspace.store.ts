import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import type { User } from '@/types/user'

interface Workspace {
  id: string
  name: string
  slug: string
  plan: 'FREE' | 'PRO'
  storage_used_bytes: number
  storage_limit_bytes: number
  created_at: string
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspace = ref<Workspace | null>(null)
  const members = ref<User[]>([])

  async function fetchWorkspace() {
    const { data } = await api.get<Workspace>('/api/v1/workspace/')
    workspace.value = data
  }

  async function fetchMembers() {
    const { data } = await api.get<User[]>('/api/v1/workspace/members')
    members.value = data
  }

  async function removeMember(userId: string) {
    await api.delete(`/api/v1/workspace/members/${userId}`)
    members.value = members.value.filter((m) => m.id !== userId)
  }

  return { workspace, members, fetchWorkspace, fetchMembers, removeMember }
})
