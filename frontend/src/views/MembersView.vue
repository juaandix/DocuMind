<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAuthStore } from '@/stores/auth.store'

const wsStore = useWorkspaceStore()
const auth = useAuthStore()

const canManage = computed(() => auth.user?.role === 'OWNER' || auth.user?.role === 'ADMIN')

onMounted(() => wsStore.fetchMembers())

const roleConfig: Record<string, { label: string; cls: string }> = {
  OWNER: { label: 'Owner', cls: 'border-yellow-500 bg-yellow-400 text-black' },
  ADMIN: { label: 'Admin', cls: 'border-black dark:border-white bg-black dark:bg-white text-yellow-400 dark:text-black' },
  MEMBER: { label: 'Member', cls: 'border-black/30 dark:border-white/30 text-black/60 dark:text-white/60' },
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
        <h1 class="text-3xl font-black uppercase tracking-tight text-black dark:text-white">Members</h1>
        <p class="text-sm font-bold text-black/40 dark:text-white/40 mt-1 uppercase">{{ wsStore.members.length }} in workspace</p>
      </div>
    </div>

    <div v-if="wsStore.members.length === 0" class="flex justify-center py-20">
      <div class="w-8 h-8 border-4 border-black dark:border-white border-t-yellow-400 dark:border-t-yellow-400 rounded-full animate-spin"></div>
    </div>

    <div v-else class="relative mb-5">
      <div class="absolute inset-0 translate-x-2 translate-y-2 bg-black dark:bg-yellow-400"></div>
      <div class="relative bg-white dark:bg-neutral-900 border-2 border-black dark:border-white divide-y-2 divide-black/10 dark:divide-white/10">
        <div v-for="member in wsStore.members" :key="member.id"
          class="flex items-center gap-4 px-5 py-4 hover:bg-yellow-50 dark:hover:bg-neutral-800 transition-colors">
          <div class="w-10 h-10 bg-black dark:bg-yellow-400 border-2 border-black shadow-[2px_2px_0_0_#facc15] dark:shadow-[2px_2px_0_0_#000] flex items-center justify-center text-xs font-black text-yellow-400 dark:text-black flex-shrink-0">
            {{ initials(member.full_name) }}
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-black uppercase text-black dark:text-white truncate">{{ member.full_name }}</p>
              <span v-if="member.id === auth.user?.id" class="text-[10px] font-black uppercase text-black/30 dark:text-white/30">(you)</span>
            </div>
            <p class="text-xs font-medium text-black/50 dark:text-white/50 truncate">{{ member.email }}</p>
          </div>

          <span :class="['text-[10px] font-black uppercase px-2 py-0.5 border-2', roleConfig[member.role]?.cls ?? '']">
            {{ roleConfig[member.role]?.label ?? member.role }}
          </span>

          <button v-if="canManage && member.id !== auth.user?.id && member.role !== 'OWNER'"
            @click="handleRemove(member.id, member.full_name)"
            class="p-1.5 border-2 border-transparent hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-black/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Remove member">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zm8-4l4 4m0-4l-4 4"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="border-2 border-black dark:border-white bg-yellow-400 p-4 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
      <p class="text-sm font-black uppercase text-black">Invite team members</p>
      <p class="text-xs font-medium text-black/70 mt-1">
        Share your workspace registration link. New members can sign up and will be added automatically.
      </p>
    </div>
  </div>
</template>
