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

onMounted(async () => { await wsStore.fetchWorkspace(); name.value = wsStore.workspace?.name ?? '' })

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
  saving.value = true; saved.value = false; error.value = ''
  try {
    const api = (await import('@/services/api')).default
    const { data } = await api.patch('/api/v1/workspace/', { name: name.value.trim() })
    wsStore.workspace = data
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to save'
  } finally { saving.value = false }
}
</script>

<template>
  <div class="p-8 max-w-lg">
    <h1 class="text-2xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-6">Workspace</h1>

    <div v-if="!wsStore.workspace" class="flex justify-center py-20">
      <div class="w-6 h-6 border-2 border-[#0071e3]/30 border-t-[#0071e3] rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <div class="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none p-5 space-y-4 mb-4">
        <h2 class="text-xs font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-wider">General</h2>

        <div>
          <label class="block text-xs font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-wider mb-1.5">Workspace Name</label>
          <input v-model="name" type="text" :disabled="!canEdit"
            class="w-full rounded-lg border border-black/[0.12] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#3a3a3c] px-3.5 py-2.5 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] dark:focus:border-[#2997ff] disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-wider mb-1.5">Plan</label>
          <span :class="[
            'inline-block text-xs font-medium px-2.5 py-1 rounded-full',
            wsStore.workspace.plan === 'PRO'
              ? 'bg-[#af52de]/[0.1] text-[#7a2e9c] dark:text-[#bf5af2]'
              : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#6e6e73] dark:text-[#98989d]'
          ]">{{ wsStore.workspace.plan }}</span>
        </div>

        <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>

        <div v-if="canEdit" class="flex items-center gap-3 pt-1">
          <button @click="save" :disabled="saving"
            class="bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-60 text-white text-sm font-medium rounded-lg px-5 py-2.5 shadow-[0_1px_3px_rgba(0,113,227,0.4)] transition-colors">
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
          <span v-if="saved" class="text-sm text-[#34c759] font-medium">✓ Saved</span>
        </div>
      </div>

      <!-- Storage -->
      <div class="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-wider">Storage</h2>
          <span :class="['text-xs font-medium', storagePercent > 85 ? 'text-red-500' : 'text-[#6e6e73] dark:text-[#98989d]']">{{ storagePercent }}%</span>
        </div>
        <div class="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden">
          <div :class="['h-full rounded-full transition-all', storagePercent > 85 ? 'bg-red-500' : 'bg-[#0071e3]']"
            :style="{ width: `${storagePercent}%` }"></div>
        </div>
        <div class="flex justify-between text-xs text-[#6e6e73] dark:text-[#98989d]">
          <span>{{ formatBytes(wsStore.workspace.storage_used_bytes) }} used</span>
          <span v-if="storagePercent > 85" class="text-red-500 font-medium">Almost full</span>
          <span v-else>{{ formatBytes(wsStore.workspace.storage_limit_bytes) }} total</span>
        </div>
      </div>
    </template>
  </div>
</template>
