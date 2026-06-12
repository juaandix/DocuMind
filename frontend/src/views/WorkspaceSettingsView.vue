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
    <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Workspace</h1>

    <div v-if="!wsStore.workspace" class="flex justify-center py-16">
      <div class="w-8 h-8 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-5 space-y-4">
        <h2 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">General</h2>
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Workspace name</label>
          <input
            v-model="name"
            type="text"
            :disabled="!canEdit"
            class="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Plan</label>
          <span :class="[
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
            wsStore.workspace.plan === 'PRO'
              ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          ]">
            {{ wsStore.workspace.plan }}
          </span>
        </div>
        <div class="flex items-center gap-3" v-if="canEdit">
          <button
            @click="save"
            :disabled="saving"
            class="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 disabled:opacity-50 transition-all"
          >
            {{ saving ? 'Saving…' : 'Save' }}
          </button>
          <span v-if="saved" class="text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Saved
          </span>
        </div>
        <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- Storage -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Storage</h2>
        <div class="flex items-end justify-between text-sm mb-2">
          <span class="font-medium text-slate-700 dark:text-slate-300">{{ formatBytes(wsStore.workspace.storage_used_bytes) }}</span>
          <span class="text-xs text-slate-400 dark:text-slate-500">of {{ formatBytes(wsStore.workspace.storage_limit_bytes) }}</span>
        </div>
        <div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all duration-500', storagePercent > 85 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-cyan-500']"
            :style="{ width: `${storagePercent}%` }"
          ></div>
        </div>
        <div class="flex items-center justify-between mt-2">
          <p class="text-xs text-slate-400 dark:text-slate-500">{{ storagePercent }}% used</p>
          <p v-if="storagePercent > 85" class="text-xs font-semibold text-red-600 dark:text-red-400">Almost full</p>
        </div>
      </div>
    </template>
  </div>
</template>
