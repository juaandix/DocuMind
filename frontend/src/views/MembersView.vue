<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAuthStore } from '@/stores/auth.store'

const wsStore = useWorkspaceStore()
const auth = useAuthStore()

const canManage = computed(() => auth.user?.role === 'OWNER' || auth.user?.role === 'ADMIN')

onMounted(() => wsStore.fetchMembers())

const roleConfig: Record<string, { label: string; cls: string }> = {
  OWNER: { label: 'Owner', cls: 'bg-[#ff9f0a]/[0.1] text-[#b86d00]' },
  ADMIN: { label: 'Admin', cls: 'bg-[#0071e3]/[0.08] text-[#0071e3]' },
  MEMBER: { label: 'Member', cls: 'bg-black/[0.04] text-[#6e6e73]' },
}

async function handleRemove(userId: string, name: string) {
  if (!confirm(`Remove ${name} from this workspace?`)) return
  await wsStore.removeMember(userId)
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// Invite form
const inviteEmail = ref('')
const inviteRole = ref('MEMBER')
const inviting = ref(false)
const inviteError = ref('')
const inviteLink = ref('')

async function handleInvite() {
  inviteError.value = ''
  inviteLink.value = ''
  inviting.value = true
  try {
    const token = await wsStore.inviteMember(inviteEmail.value, inviteRole.value)
    inviteLink.value = `${window.location.origin}/invite/${token}`
    inviteEmail.value = ''
    inviteRole.value = 'MEMBER'
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    inviteError.value = err.response?.data?.detail ?? 'Failed to send invite'
  } finally {
    inviting.value = false
  }
}

function copyLink() {
  navigator.clipboard.writeText(inviteLink.value)
}
</script>

<template>
  <div class="p-8 max-w-2xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-[#1d1d1f]">Members</h1>
        <p class="text-sm text-[#6e6e73] mt-0.5">{{ wsStore.members.length }} members in your workspace</p>
      </div>
    </div>

    <div v-if="wsStore.members.length === 0" class="flex justify-center py-20">
      <div class="w-6 h-6 border-2 border-[#0071e3]/30 border-t-[#0071e3] rounded-full animate-spin"></div>
    </div>

    <div v-else class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden mb-5">
      <div v-for="member in wsStore.members" :key="member.id"
        class="flex items-center gap-4 px-5 py-4 border-b border-black/[0.04] last:border-0 hover:bg-[#f5f5f7] transition-colors">
        <div class="w-9 h-9 rounded-full bg-[#0071e3] flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
          {{ initials(member.full_name) }}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-[#1d1d1f] truncate">{{ member.full_name }}</p>
            <span v-if="member.id === auth.user?.id" class="text-[10px] text-[#6e6e73]">(you)</span>
          </div>
          <p class="text-xs text-[#6e6e73] truncate">{{ member.email }}</p>
        </div>

        <span :class="['text-xs font-medium px-2.5 py-1 rounded-full', roleConfig[member.role]?.cls ?? '']">
          {{ roleConfig[member.role]?.label ?? member.role }}
        </span>

        <button v-if="canManage && member.id !== auth.user?.id && member.role !== 'OWNER'"
          @click="handleRemove(member.id, member.full_name)"
          class="p-1.5 rounded-lg text-[#6e6e73] hover:text-red-500 hover:bg-red-50 transition-colors" title="Remove member">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zm8-4l4 4m0-4l-4 4"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Invite form (owners/admins only) -->
    <div v-if="canManage" class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5">
      <p class="text-sm font-semibold text-[#1d1d1f] mb-4">Invite a member</p>

      <form @submit.prevent="handleInvite" class="space-y-3">
        <div class="flex gap-2.5">
          <input
            v-model="inviteEmail"
            type="email"
            required
            placeholder="colleague@company.com"
            class="flex-1 px-3 py-2 text-sm rounded-lg border border-black/[0.12] bg-[#f5f5f7] text-[#1d1d1f] placeholder-[#a0a0a5] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] transition-colors"
          />
          <select
            v-model="inviteRole"
            class="px-3 py-2 text-sm rounded-lg border border-black/[0.12] bg-[#f5f5f7] text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] transition-colors"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            type="submit"
            :disabled="inviting"
            class="flex items-center gap-1.5 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 shadow-[0_1px_3px_rgba(0,113,227,0.4)] transition-colors whitespace-nowrap"
          >
            <svg v-if="inviting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Send invite
          </button>
        </div>

        <p v-if="inviteError" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ inviteError }}</p>

        <!-- Invite link (shown after success) -->
        <div v-if="inviteLink" class="flex items-center gap-2 bg-[#34c759]/[0.06] border border-[#34c759]/30 rounded-lg px-3 py-2.5">
          <svg class="w-4 h-4 text-[#34c759] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          <p class="text-xs text-[#1d1d1f] truncate flex-1">{{ inviteLink }}</p>
          <button type="button" @click="copyLink"
            class="text-xs font-medium text-[#0071e3] hover:underline whitespace-nowrap">
            Copy
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
