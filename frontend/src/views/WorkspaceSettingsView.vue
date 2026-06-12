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
    <h1 class="text-3xl font-black uppercase tracking-tight text-black dark:text-white mb-6">Workspace</h1>

    <div v-if="!wsStore.workspace" class="flex justify-center py-20">
      <div class="w-8 h-8 border-4 border-black dark:border-white border-t-yellow-400 dark:border-t-yellow-400 rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <!-- General settings -->
      <div class="relative mb-5">
        <div class="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-black dark:bg-yellow-400"></div>
        <div class="relative bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-5 space-y-4">
          <h2 class="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">General</h2>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-black/50 dark:text-white/50 mb-1.5">Workspace Name</label>
            <input v-model="name" type="text" :disabled="!canEdit"
              class="w-full border-2 border-black dark:border-white bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-black dark:text-white focus:outline-none focus:shadow-[4px_4px_0_0_#000] dark:focus:shadow-[4px_4px_0_0_#fff] focus:-translate-x-0.5 focus:-translate-y-0.5 disabled:border-black/20 dark:disabled:border-white/20 disabled:bg-black/5 dark:disabled:bg-white/5 disabled:text-black/40 dark:disabled:text-white/40 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-black/50 dark:text-white/50 mb-1.5">Plan</label>
            <span :class="[
              'inline-block text-[10px] font-black uppercase px-2.5 py-1 border-2',
              wsStore.workspace.plan === 'PRO'
                ? 'border-yellow-500 bg-yellow-400 text-black shadow-[2px_2px_0_0_#000]'
                : 'border-black/30 dark:border-white/30 text-black/60 dark:text-white/60'
            ]">
              {{ wsStore.workspace.plan }}
            </span>
          </div>

          <p v-if="error" class="text-sm font-bold text-red-700 dark:text-red-400">{{ error }}</p>

          <div v-if="canEdit" class="flex items-center gap-3">
            <button @click="save" :disabled="saving"
              class="bg-yellow-400 text-black font-black text-xs uppercase tracking-widest px-5 py-2.5 border-2 border-black shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
            <span v-if="saved" class="text-sm font-black uppercase text-green-700 dark:text-green-400">✓ Saved</span>
          </div>
        </div>
      </div>

      <!-- Storage -->
      <div class="relative">
        <div class="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-black dark:bg-yellow-400"></div>
        <div class="relative bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">Storage</h2>
            <span :class="['text-[10px] font-black uppercase tracking-widest', storagePercent > 85 ? 'text-red-600 dark:text-red-400' : 'text-black dark:text-white']">
              {{ storagePercent }}%
            </span>
          </div>
          <div class="h-3 bg-black/10 dark:bg-white/10 border-2 border-black dark:border-white overflow-hidden">
            <div :class="['h-full border-r-2 border-black dark:border-black transition-all', storagePercent > 85 ? 'bg-red-500' : 'bg-yellow-400']"
              :style="{ width: `${storagePercent}%` }"></div>
          </div>
          <div class="flex justify-between text-xs font-bold text-black/50 dark:text-white/50">
            <span>{{ formatBytes(wsStore.workspace.storage_used_bytes) }} used</span>
            <span v-if="storagePercent > 85" class="font-black uppercase text-red-600 dark:text-red-400">Almost full!</span>
            <span v-else>{{ formatBytes(wsStore.workspace.storage_limit_bytes) }} total</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
