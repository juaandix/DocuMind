<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Search, Trash2, FileText } from 'lucide-vue-next'
import { useDocumentsStore } from '@/stores/documents.store'
import UiButton from '@/components/ui/UiButton.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { docType, formatSize } from '@/utils/format'
import type { DocumentStatus } from '@/types/document'

const store = useDocumentsStore()
const route = useRoute()
const { t } = useI18n()
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
watch(() => route.query.q, (q) => { search.value = typeof q === 'string' ? q : '' })
const statusFilter = ref<DocumentStatus | 'ALL'>('ALL')
const tagFilter = ref<string | null>(null)
const deleting = ref<string | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await store.fetchDocuments()
  pollTimer = setInterval(async () => {
    const hasProcessing = store.documents.some(d => d.status === 'PROCESSING' || d.status === 'UPLOADING')
    if (hasProcessing) await store.fetchDocuments()
  }, 5000)
})

onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })

const allTags = computed(() => {
  const set = new Set<string>()
  store.documents.forEach(d => d.tags?.forEach(t => set.add(t)))
  return [...set].sort()
})

const filtered = computed(() =>
  store.documents.filter(d => {
    const matchesName = d.original_name.toLowerCase().includes(search.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'ALL' || d.status === statusFilter.value
    const matchesTag = !tagFilter.value || d.tags?.includes(tagFilter.value)
    return matchesName && matchesStatus && matchesTag
  })
)

const statusCounts = computed(() => ({
  ALL: store.documents.length,
  READY: store.documents.filter(d => d.status === 'READY').length,
  PROCESSING: store.documents.filter(d => d.status === 'PROCESSING').length,
  UPLOADING: store.documents.filter(d => d.status === 'UPLOADING').length,
  ERROR: store.documents.filter(d => d.status === 'ERROR').length,
}))

const filters: { key: DocumentStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'documents.all' },
  { key: 'READY', label: 'status.READY' },
  { key: 'PROCESSING', label: 'status.PROCESSING' },
  { key: 'ERROR', label: 'status.ERROR' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
async function handleDelete(id: string) {
  if (!confirm(t('documents.confirmDelete'))) return
  deleting.value = id
  try { await store.removeDocument(id) } finally { deleting.value = null }
}
</script>


<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
    <PageHeader :title="$t('documents.title')" :description="$t('documents.count', { n: store.documents.length })">
      <template #actions><UiButton to="/documents/upload"><Plus class="size-4" />{{ $t('documents.upload') }}</UiButton></template>
    </PageHeader>

    <!-- Search + filters -->
    <div class="flex flex-col gap-3">
      <div class="flex flex-col gap-3 sm:flex-row">
        <label class="relative flex-1">
          <span class="sr-only">{{ $t('documents.searchLabel') }}</span>
          <Search class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" />
          <input v-model="search" type="search" :placeholder="$t('documents.search')"
            class="min-h-11 w-full rounded-[5px] border border-line bg-surface pr-4 pl-10 text-[15px] text-ink placeholder:text-ink-3 focus:border-line-strong focus:ring-2 focus:ring-alert focus:outline-none" />
        </label>
        <div class="flex overflow-x-auto rounded-[5px] border border-line bg-surface" role="group" :aria-label="$t('documents.filterStatus')">
          <button v-for="f in filters" :key="f.key" :aria-pressed="statusFilter === f.key"
            :class="[
              'flex min-h-11 items-center gap-2 border-l border-line px-4 text-[13px] font-semibold whitespace-nowrap first:border-l-0',
              statusFilter === f.key ? 'bg-primary text-on-primary' : 'text-ink-2 hover:bg-sunken hover:text-ink',
            ]"
            @click="statusFilter = f.key">
            {{ $t(f.label) }}
            <span class="font-mono text-[12px] tabular opacity-70">{{ statusCounts[f.key as keyof typeof statusCounts] }}</span>
          </button>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="allTags.length > 0" class="flex flex-wrap gap-1.5" role="group" :aria-label="$t('documents.filterTag')">
        <button :aria-pressed="!tagFilter"
          :class="['rounded-[4px] border px-2.5 py-1 font-mono text-[12px] font-semibold', !tagFilter ? 'border-line-strong bg-primary text-on-primary' : 'border-line text-ink-2 hover:text-ink']"
          @click="tagFilter = null">{{ $t('documents.allTags') }}</button>
        <button v-for="tag in allTags" :key="tag" :aria-pressed="tagFilter === tag"
          :class="['rounded-[4px] border px-2.5 py-1 font-mono text-[12px] font-semibold', tagFilter === tag ? 'border-line-strong bg-primary text-on-primary' : 'border-line text-ink-2 hover:text-ink']"
          @click="tagFilter = tagFilter === tag ? null : tag"># {{ tag }}</button>
      </div>
    </div>

    <div v-if="filtered.length === 0" class="flex flex-col items-center justify-center rounded-pass border border-dashed border-line bg-surface py-20 text-center">
      <FileText class="mb-3 size-7 text-ink-3" :stroke-width="1.5" />
      <p class="text-base font-semibold text-ink">{{ $t('documents.empty') }}</p>
      <router-link v-if="!search" to="/documents/upload" class="mt-1 text-[13px] font-semibold text-ink underline">{{ $t('dashboard.uploadFirst') }}</router-link>
      <button v-else class="mt-1 text-[13px] font-semibold text-ink underline" @click="search = ''">{{ $t('documents.clearSearch') }}</button>
    </div>

    <div v-else class="relative overflow-x-auto rounded-pass bg-surface shadow-pass">
      <table class="w-full table-fixed text-left">
        <thead>
          <tr class="label border-b border-line">
            <th class="px-5 py-3 font-semibold">{{ $t('documents.name') }}</th>
            <th class="hidden w-20 px-3 py-3 font-semibold sm:table-cell">{{ $t('common.type') }}</th>
            <th class="w-36 px-3 py-3 font-semibold">{{ $t('common.status') }}</th>
            <th class="hidden w-28 px-3 py-3 text-right font-semibold md:table-cell">{{ $t('common.size') }}</th>
            <th class="hidden w-36 px-3 py-3 text-right font-semibold md:table-cell">{{ $t('common.added') }}</th>
            <th class="w-14 px-3 py-3"><span class="sr-only">{{ $t('documents.actions') }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in filtered" :key="doc.id"
            :class="['group border-t border-line first:border-t-0', store.changedIds.has(doc.id) ? 'bg-alert-soft' : 'hover:bg-sunken']">
            <td class="px-5 py-3">
              <router-link :to="`/documents/${doc.id}`" class="block truncate text-[14px] font-semibold text-ink hover:underline"
                @click="store.acknowledge(doc.id)">{{ doc.original_name }}</router-link>
              <span v-if="doc.chunk_count" class="font-mono text-[12px] text-ink-3">{{ $t('common.nChunks', { n: doc.chunk_count }) }}</span>
            </td>
            <td class="hidden px-3 py-3 font-mono text-[13px] text-ink-2 sm:table-cell">{{ docType(doc.mime_type, doc.original_name) }}</td>
            <td class="px-3 py-3"><StatusChip :status="doc.status" :changed="store.changedIds.has(doc.id)" /></td>
            <td class="hidden px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap text-ink-2 md:table-cell">{{ formatSize(doc.size_bytes) }}</td>
            <td class="hidden px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap text-ink-2 md:table-cell">{{ formatDate(doc.created_at) }}</td>
            <td class="px-3 py-3 text-right">
              <button :disabled="deleting === doc.id" :aria-label="$t('documents.delete', { name: doc.original_name })"
                class="rounded p-2 text-ink-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 disabled:opacity-40"
                @click="handleDelete(doc.id)">
                <Trash2 class="size-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
