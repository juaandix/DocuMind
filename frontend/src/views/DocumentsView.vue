<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useDocumentsStore } from '@/stores/documents.store'
import type { DocumentStatus } from '@/types/document'

const store = useDocumentsStore()
const search = ref('')
const deleting = ref<string | null>(null)

onMounted(() => store.fetchDocuments())

const filtered = computed(() =>
  store.documents.filter(d => d.original_name.toLowerCase().includes(search.value.toLowerCase()))
)

const statusConfig: Record<DocumentStatus, { label: string; cls: string }> = {
  UPLOADING: { label: 'Uploading', cls: 'bg-[#0071e3]/[0.08] text-[#0071e3] dark:text-[#2997ff]' },
  PROCESSING: { label: 'Processing', cls: 'bg-[#ff9f0a]/[0.1] text-[#b86d00] dark:text-[#ffd60a]' },
  READY: { label: 'Ready', cls: 'bg-[#34c759]/[0.1] text-[#248a3d] dark:text-[#30d158]' },
  ERROR: { label: 'Error', cls: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' },
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
        <h1 class="text-2xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Documents</h1>
        <p class="text-sm text-[#6e6e73] dark:text-[#98989d] mt-0.5">{{ store.documents.length }} documents in your workspace</p>
      </div>
      <router-link to="/documents/upload"
        class="inline-flex items-center gap-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium rounded-lg px-4 py-2 shadow-[0_1px_3px_rgba(0,113,227,0.4)] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Upload
      </router-link>
    </div>

    <div class="relative mb-5">
      <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e73]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input v-model="search" type="text" placeholder="Search documents…"
        class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/[0.1] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3] dark:focus:border-[#2997ff]"
      />
    </div>

    <div v-if="filtered.length === 0" class="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none">
      <div class="w-14 h-14 rounded-2xl bg-[#f5f5f7] dark:bg-[#3a3a3c] flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-[#6e6e73]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
      </div>
      <p class="text-base font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">No documents found</p>
      <router-link v-if="!search" to="/documents/upload" class="text-sm text-[#0071e3] dark:text-[#2997ff] hover:underline mt-2">Upload your first document</router-link>
    </div>

    <div v-else class="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none overflow-hidden">
      <table class="w-full text-sm">
        <thead class="border-b border-black/[0.06] dark:border-white/[0.06]">
          <tr>
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#6e6e73] dark:text-[#98989d]">Name</th>
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#6e6e73] dark:text-[#98989d]">Status</th>
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#6e6e73] dark:text-[#98989d]">Size</th>
            <th class="text-left px-5 py-3 text-xs font-semibold text-[#6e6e73] dark:text-[#98989d]">Date</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
          <tr v-for="doc in filtered" :key="doc.id" class="hover:bg-[#f5f5f7] dark:hover:bg-[#3a3a3c] transition-colors group">
            <td class="px-5 py-3.5">
              <router-link :to="`/documents/${doc.id}`" class="font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:text-[#0071e3] dark:hover:text-[#2997ff] transition-colors">{{ doc.original_name }}</router-link>
              <div v-if="doc.chunk_count" class="text-xs text-[#6e6e73] dark:text-[#98989d] mt-0.5">{{ doc.chunk_count }} chunks</div>
            </td>
            <td class="px-5 py-3.5">
              <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', statusConfig[doc.status].cls]">
                {{ statusConfig[doc.status].label }}
              </span>
            </td>
            <td class="px-5 py-3.5 text-xs text-[#6e6e73] dark:text-[#98989d]">{{ formatSize(doc.size_bytes) }}</td>
            <td class="px-5 py-3.5 text-xs text-[#6e6e73] dark:text-[#98989d]">{{ formatDate(doc.created_at) }}</td>
            <td class="px-5 py-3.5 text-right">
              <button @click="handleDelete(doc.id)" :disabled="deleting === doc.id"
                class="p-1.5 rounded-lg text-[#6e6e73] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40">
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
