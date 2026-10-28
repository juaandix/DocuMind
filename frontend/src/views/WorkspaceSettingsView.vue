<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useAuthStore } from '@/stores/auth.store'
import { Check, Loader } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import SettingsTabs from '@/components/ui/SettingsTabs.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'

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
  <div class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
    <PageHeader title="Settings" />
    <SettingsTabs />

    <div v-if="!wsStore.workspace" class="flex items-center gap-3 py-16 text-ink-2"><Loader class="size-5 animate-spin" />Loading workspace…</div>

    <template v-else>
      <form class="flex flex-col gap-5 rounded-pass bg-surface p-5 shadow-pass" @submit.prevent="save">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-[15px] font-semibold text-ink">Workspace</h2>
            <p class="text-[13px] text-ink-2">Shown to everyone in this workspace.</p>
          </div>
          <span :class="['rounded-[4px] px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em]',
            wsStore.workspace.plan === 'PRO' ? 'bg-alert text-on-alert' : 'border border-line-strong text-ink']">{{ wsStore.workspace.plan }} plan</span>
        </div>
        <UiInput v-model="name" label="Workspace name" :hint="canEdit ? undefined : 'Only owners and admins can rename the workspace.'" :error="error || undefined" />
        <dl class="grid grid-cols-2 gap-4">
          <div><dt class="label">Slug</dt><dd class="mt-1 font-mono text-[14px] text-ink">{{ wsStore.workspace.slug }}</dd></div>
          <div><dt class="label">Created</dt><dd class="mt-1 font-mono text-[14px] text-ink">{{ new Date(wsStore.workspace.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</dd></div>
        </dl>
        <div v-if="canEdit" class="flex items-center gap-3">
          <UiButton type="submit" :disabled="saving || !name.trim()">{{ saving ? 'Saving…' : 'Save Changes' }}</UiButton>
          <span v-if="saved" class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink" role="status"><Check class="size-4" />Saved</span>
        </div>
      </form>

      <section class="grid rounded-pass bg-surface shadow-pass sm:grid-cols-[1fr_160px]" aria-labelledby="storage-title">
        <div class="flex flex-col gap-3 p-5">
          <h2 id="storage-title" class="text-[15px] font-semibold text-ink">Storage</h2>
          <div class="h-2 overflow-hidden rounded-full bg-line" role="progressbar" :aria-valuenow="storagePercent" aria-valuemin="0" aria-valuemax="100" aria-label="Storage used">
            <div :class="['h-full rounded-full', storagePercent > 85 ? 'bg-alert' : 'bg-primary']" :style="{ width: storagePercent + '%' }" />
          </div>
          <p class="flex justify-between font-mono text-[13px] text-ink-2">
            <span>{{ formatBytes(wsStore.workspace.storage_used_bytes) }} used</span>
            <span>{{ formatBytes(wsStore.workspace.storage_limit_bytes) }} total</span>
          </p>
          <p v-if="storagePercent > 85" class="text-[13px] font-semibold text-ink">Almost full. Delete unused documents or upgrade the plan.</p>
        </div>
        <div class="flex flex-col justify-center border-dashed border-line px-5 py-4 max-sm:border-t sm:border-l">
          <p class="label">Used</p>
          <p class="font-display text-[44px] font-semibold leading-none text-ink">{{ storagePercent }}<span class="text-[24px]">%</span></p>
        </div>
      </section>
    </template>
  </div>
</template>
