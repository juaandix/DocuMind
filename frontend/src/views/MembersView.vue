<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAuthStore } from '@/stores/auth.store'

const wsStore = useWorkspaceStore()
const auth = useAuthStore()

const canManage = computed(() => auth.user?.role === 'OWNER' || auth.user?.role === 'ADMIN')

onMounted(() => wsStore.fetchMembers())

const roleConfig = {
  OWNER: { label: 'Owner', classes: 'bg-purple-100 text-purple-700' },
  ADMIN: { label: 'Admin', classes: 'bg-indigo-100 text-indigo-700' },
  MEMBER: { label: 'Member', classes: 'bg-gray-100 text-gray-600' },
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
        <h1 class="text-2xl font-bold text-gray-900">Members</h1>
        <p class="text-sm text-gray-500 mt-1">{{ wsStore.members.length }} members in your workspace</p>
      </div>
    </div>

    <div v-if="wsStore.members.length === 0" class="flex justify-center py-16">
      <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        v-for="member in wsStore.members"
        :key="member.id"
        class="flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
      >
        <!-- Avatar -->
        <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">
          {{ initials(member.full_name) }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-gray-900 truncate">{{ member.full_name }}</p>
            <span v-if="member.id === auth.user?.id" class="text-xs text-gray-400">(you)</span>
          </div>
          <p class="text-xs text-gray-500 truncate">{{ member.email }}</p>
        </div>

        <!-- Role badge -->
        <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', roleConfig[member.role].classes]">
          {{ roleConfig[member.role].label }}
        </span>

        <!-- Remove button -->
        <button
          v-if="canManage && member.id !== auth.user?.id && member.role !== 'OWNER'"
          @click="handleRemove(member.id, member.full_name)"
          class="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove member"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zm8-4l4 4m0-4l-4 4"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p class="text-sm text-blue-800 font-medium">Invitations</p>
      <p class="text-xs text-blue-600 mt-0.5">
        Share your workspace registration link to invite new members. They can register and will be added to your workspace automatically.
      </p>
    </div>
  </div>
</template>
