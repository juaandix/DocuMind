<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAuthStore } from '@/stores/auth.store'

const wsStore = useWorkspaceStore()
const auth = useAuthStore()
const name = ref('')
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const canEdit = computed(() => auth.user?.role === 'OWNER' || auth.user?.role === 'ADMIN')

onMounted(async () => {
  await wsStore.fetchWorkspace()
  name.value = wsStore.workspace?.name ?? ''
})

const storagePercent = computed(() => {
  const ws = wsStore.workspace
  if (!ws || !ws.storage_limit_bytes) return 0
  return Math.min(100, Math.round((ws.storage_used_bytes / ws.storage_limit_bytes) * 100))
})

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

async function save() {
  if (!name.value.trim()) return
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    await wsStore.fetchWorkspace() // re-fetch after patch
    const api = (await import('@/services/api')).default
    const { data } = await api.patch('/api/v1/workspace/', { name: name.value.trim() })
    wsStore.workspace = data
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-8 max-w-lg">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Workspace</h1>

    <div v-if="!wsStore.workspace" class="flex justify-center py-16">
      <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <!-- General settings -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700">General</h2>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Workspace name</label>
          <input
            v-model="name"
            type="text"
            :disabled="!canEdit"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Plan</label>
          <span :class="[
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
            wsStore.workspace.plan === 'PRO' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
          ]">
            {{ wsStore.workspace.plan }}
          </span>
        </div>
        <div class="flex items-center gap-3" v-if="canEdit">
          <button
            @click="save"
            :disabled="saving"
            class="bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <span v-if="saved" class="text-sm text-green-600 font-medium">Saved ✓</span>
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      </div>

      <!-- Storage -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-sm font-semibold text-gray-700 mb-4">Storage</h2>
        <div class="flex items-end justify-between text-sm mb-2">
          <span class="text-gray-600">{{ formatBytes(wsStore.workspace.storage_used_bytes) }} used</span>
          <span class="text-gray-400">{{ formatBytes(wsStore.workspace.storage_limit_bytes) }} total</span>
        </div>
        <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all duration-500', storagePercent > 85 ? 'bg-red-500' : 'bg-indigo-500']"
            :style="{ width: `${storagePercent}%` }"
          ></div>
        </div>
        <p class="text-xs text-gray-400 mt-1.5">{{ storagePercent }}% used</p>
      </div>
    </template>
  </div>
</template>
