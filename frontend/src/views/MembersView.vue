<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAuthStore } from '@/stores/auth.store'

const wsStore = useWorkspaceStore()
const auth = useAuthStore()

const canManage = computed(() => auth.user?.role === 'OWNER' || auth.user?.role === 'ADMIN')

onMounted(() => wsStore.fetchMembers())

const roleConfig = {
  OWNER: { label: 'Owner', badge: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20' },
  ADMIN: { label: 'Admin', badge: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20' },
  MEMBER: { label: 'Member', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700' },
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
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Members</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ wsStore.members.length }} members in your workspace</p>
      </div>
    </div>

    <div v-if="wsStore.members.length === 0" class="flex justify-center py-16">
      <div class="w-8 h-8 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 rounded-full animate-spin"></div>
    </div>

    <div v-else class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-5">
      <div
        v-for="member in wsStore.members"
        :key="member.id"
        class="flex items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-cyan-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {{ initials(member.full_name) }}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{{ member.full_name }}</p>
            <span v-if="member.id === auth.user?.id" class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">(you)</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ member.email }}</p>
        </div>

        <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', roleConfig[member.role].badge]">
          {{ roleConfig[member.role].label }}
        </span>

        <button
          v-if="canManage && member.id !== auth.user?.id && member.role !== 'OWNER'"
          @click="handleRemove(member.id, member.full_name)"
          class="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          title="Remove member"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zm8-4l4 4m0-4l-4 4"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4">
      <p class="text-sm font-semibold text-blue-800 dark:text-blue-300">Invite team members</p>
      <p class="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
        Share your workspace registration link. New members can sign up and will be added to your workspace automatically.
      </p>
    </div>
  </div>
</template>
