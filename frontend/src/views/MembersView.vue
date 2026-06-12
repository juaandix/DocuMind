<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAuthStore } from '@/stores/auth.store'

const wsStore = useWorkspaceStore()
const auth = useAuthStore()

const canManage = computed(() => auth.user?.role === 'OWNER' || auth.user?.role === 'ADMIN')

onMounted(() => wsStore.fetchMembers())

const roleConfig: Record<string, { label: string; cls: string }> = {
  OWNER: { label: 'Owner', cls: 'bg-[#ff9f0a]/[0.1] text-[#b86d00] dark:text-[#ffd60a]' },
  ADMIN: { label: 'Admin', cls: 'bg-[#0071e3]/[0.08] text-[#0071e3] dark:text-[#2997ff]' },
  MEMBER: { label: 'Member', cls: 'bg-black/[0.04] dark:bg-white/[0.06] text-[#6e6e73] dark:text-[#98989d]' },
}

async function handleRemove(userId: string, name: string) {
  if (!confirm(`Remove ${name} from this workspace?`)) return
  await wsStore.removeMember(userId)
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}
</script>

<template>
  <div class="p-8 max-w-2xl">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Members</h1>
        <p class="text-sm text-[#6e6e73] dark:text-[#98989d] mt-0.5">{{ wsStore.members.length }} members in your workspace</p>
      </div>
    </div>

    <div v-if="wsStore.members.length === 0" class="flex justify-center py-20">
      <div class="w-6 h-6 border-2 border-[#0071e3]/30 border-t-[#0071e3] rounded-full animate-spin"></div>
    </div>

    <div v-else class="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none overflow-hidden mb-4">
      <div v-for="member in wsStore.members" :key="member.id"
        class="flex items-center gap-4 px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c] transition-colors">
        <div class="w-9 h-9 rounded-full bg-[#0071e3] flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
          {{ initials(member.full_name) }}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] truncate">{{ member.full_name }}</p>
            <span v-if="member.id === auth.user?.id" class="text-[10px] text-[#6e6e73] dark:text-[#98989d]">(you)</span>
          </div>
          <p class="text-xs text-[#6e6e73] dark:text-[#98989d] truncate">{{ member.email }}</p>
        </div>

        <span :class="['text-xs font-medium px-2.5 py-1 rounded-full', roleConfig[member.role]?.cls ?? '']">
          {{ roleConfig[member.role]?.label ?? member.role }}
        </span>

        <button v-if="canManage && member.id !== auth.user?.id && member.role !== 'OWNER'"
          @click="handleRemove(member.id, member.full_name)"
          class="p-1.5 rounded-lg text-[#6e6e73] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Remove member">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zm8-4l4 4m0-4l-4 4"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="bg-[#0071e3]/[0.06] dark:bg-[#2997ff]/[0.06] border border-[#0071e3]/20 dark:border-[#2997ff]/20 rounded-xl p-4">
      <p class="text-sm font-medium text-[#0071e3] dark:text-[#2997ff]">Invite team members</p>
      <p class="text-xs text-[#6e6e73] dark:text-[#98989d] mt-0.5">
        Share your workspace registration link. New members can sign up and will be added automatically.
      </p>
    </div>
  </div>
</template>
