<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useDocumentsStore } from '@/stores/documents.store'
import type { DocumentStatus } from '@/types/document'

const store = useDocumentsStore()
const search = ref('')
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

const statusConfig: Record<DocumentStatus, { label: string; cls: string }> = {
  UPLOADING: { label: 'Uploading', cls: 'bg-[#0071e3]/[0.08] text-[#0071e3]' },
  PROCESSING: { label: 'Processing', cls: 'bg-[#ff9f0a]/[0.1] text-[#b86d00]' },
  READY: { label: 'Ready', cls: 'bg-[#34c759]/[0.1] text-[#248a3d]' },
  ERROR: { label: 'Error', cls: 'bg-red-50 text-red-600' },
}

function formatSize(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
async function handleDelete(id: string) {
  if (!confirm('Delete this document?')) return
  deleting.value = id
  try { await store.removeDocument(id) } finally { deleting.value = null }
}
</script>

<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-[#1d1d1f]">Documents</h1>
        <p class="text-sm text-[#6e6e73] mt-0.5">{{ store.documents.length }} documents in your workspace</p>
      </div>
      <router-link to="/documents/upload"
        class="inline-flex items-center gap-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium rounded-lg px-4 py-2 shadow-[0_1px_3px_rgba(0,113,227,0.4)] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Upload
      </router-link>
    </div>

    <!-- Search + filters -->
    <div class="flex flex-col gap-3 mb-5">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e73]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input v-model="search" type="text" placeholder="Search documents…"
            class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/[0.1] bg-white text-sm text-[#1d1d1f] placeholder-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3]"
          />
        </div>
        <div class="flex items-center gap-1.5">
          <button v-for="(label, key) in ({ ALL: 'All', READY: 'Ready', PROCESSING: 'Processing', ERROR: 'Error' } as Record<string,string>)" :key="key"
            @click="statusFilter = key as DocumentStatus | 'ALL'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              statusFilter === key
                ? key === 'ALL' ? 'bg-[#1d1d1f] text-white' : key === 'READY' ? 'bg-[#34c759] text-white' : key === 'ERROR' ? 'bg-red-500 text-white' : 'bg-[#ff9f0a] text-white'
                : 'bg-white border border-black/[0.1] text-[#6e6e73] hover:text-[#1d1d1f]'
            ]">
            {{ label }}
            <span class="ml-1 opacity-70">{{ statusCounts[key as keyof typeof statusCounts] }}</span>
          </button>
        </div>
      </div>

      <!-- Tag cloud -->
      <div v-if="allTags.length > 0" class="flex flex-wrap gap-1.5">
        <button @click="tagFilter = null"
          :class="['px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors', !tagFilter ? 'bg-[#0071e3]/[0.1] text-[#0071e3]' : 'bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]']">
          All tags
        </button>
        <button v-for="tag in allTags" :key="tag" @click="tagFilter = tagFilter === tag ? null : tag"
          :class="['px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors', tagFilter === tag ? 'bg-[#0071e3] text-white' : 'bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]']">
          # {{ tag }}
        </button>
      </div>
    </div>

    <div v-if="filtered.length === 0" class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div class="w-14 h-14 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-[#6e6e73]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
      </div>
      <p class="text-base font-medium text-[#1d1d1f]">No documents found</p>
      <router-link v-if="!search" to="/documents/upload" class="text-sm text-[#0071e3] hover:underline mt-2">Upload your first document</router-link>
    </div>

    <div v-else class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
      <table class="w-full text-sm">
        <thead class="border-b border-black/[0.06]">
          <tr>
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#6e6e73]">Name</th>
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#6e6e73]">Status</th>
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#6e6e73]">Size</th>
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#6e6e73]">Date</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-black/[0.04]">
          <tr v-for="doc in filtered" :key="doc.id" class="hover:bg-[#f5f5f7] transition-colors group">
            <td class="px-5 py-3.5">
              <router-link :to="`/documents/${doc.id}`" class="font-medium text-[#1d1d1f] hover:text-[#0071e3] transition-colors">{{ doc.original_name }}</router-link>
              <div v-if="doc.chunk_count" class="text-xs text-[#6e6e73] mt-0.5">{{ doc.chunk_count }} chunks</div>
            </td>
            <td class="px-5 py-3.5">
              <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', statusConfig[doc.status].cls]">
                {{ statusConfig[doc.status].label }}
              </span>
            </td>
            <td class="px-5 py-3.5 text-xs text-[#6e6e73]">{{ formatSize(doc.size_bytes) }}</td>
            <td class="px-5 py-3.5 text-xs text-[#6e6e73]">{{ formatDate(doc.created_at) }}</td>
            <td class="px-5 py-3.5 text-right">
              <button @click="handleDelete(doc.id)" :disabled="deleting === doc.id"
                class="p-1.5 rounded-lg text-[#6e6e73] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
