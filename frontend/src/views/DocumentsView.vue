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
  UPLOADING: { label: 'Uploading', cls: 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' },
  PROCESSING: { label: 'Processing', cls: 'border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' },
  READY: { label: 'Ready', cls: 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
  ERROR: { label: 'Error', cls: 'border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
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
        <h1 class="text-3xl font-black uppercase tracking-tight text-black dark:text-white">Documents</h1>
        <p class="text-sm font-bold text-black/40 dark:text-white/40 mt-1 uppercase">{{ store.documents.length }} in workspace</p>
      </div>
      <router-link to="/documents/upload"
        class="inline-flex items-center gap-2 bg-yellow-400 text-black font-black text-xs uppercase tracking-widest px-4 py-2.5 border-2 border-black shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Upload
      </router-link>
    </div>

    <div class="relative mb-6">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input v-model="search" type="text" placeholder="Search documents..."
        class="w-full pl-10 pr-4 py-2.5 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 text-sm font-medium text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:shadow-[4px_4px_0_0_#000] dark:focus:shadow-[4px_4px_0_0_#fff] focus:-translate-x-0.5 focus:-translate-y-0.5"
      />
    </div>

    <div v-if="filtered.length === 0" class="text-center py-20 border-2 border-dashed border-black/20 dark:border-white/20">
      <p class="text-lg font-black uppercase text-black/30 dark:text-white/30">No documents found</p>
      <router-link v-if="!search" to="/documents/upload" class="text-sm font-black uppercase text-yellow-600 hover:underline mt-3 block">Upload one →</router-link>
    </div>

    <div v-else class="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
      <table class="w-full text-sm">
        <thead class="bg-black dark:bg-yellow-400 border-b-2 border-black dark:border-yellow-400">
          <tr>
            <th class="text-left px-4 py-3 text-[10px] font-black text-yellow-400 dark:text-black uppercase tracking-widest">Name</th>
            <th class="text-left px-4 py-3 text-[10px] font-black text-yellow-400 dark:text-black uppercase tracking-widest">Status</th>
            <th class="text-left px-4 py-3 text-[10px] font-black text-yellow-400 dark:text-black uppercase tracking-widest">Size</th>
            <th class="text-left px-4 py-3 text-[10px] font-black text-yellow-400 dark:text-black uppercase tracking-widest">Date</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y-2 divide-black/10 dark:divide-white/10">
          <tr v-for="doc in filtered" :key="doc.id" class="hover:bg-yellow-50 dark:hover:bg-neutral-800 transition-colors">
            <td class="px-4 py-3">
              <router-link :to="`/documents/${doc.id}`" class="font-bold text-black dark:text-white hover:underline">{{ doc.original_name }}</router-link>
              <div v-if="doc.chunk_count" class="text-xs font-medium text-black/40 dark:text-white/40 mt-0.5">{{ doc.chunk_count }} chunks</div>
            </td>
            <td class="px-4 py-3">
              <span :class="['text-[10px] font-black uppercase px-2 py-0.5 border-2', statusConfig[doc.status].cls]">
                {{ statusConfig[doc.status].label }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs font-bold text-black/50 dark:text-white/50">{{ formatSize(doc.size_bytes) }}</td>
            <td class="px-4 py-3 text-xs font-bold text-black/50 dark:text-white/50">{{ formatDate(doc.created_at) }}</td>
            <td class="px-4 py-3 text-right">
              <button @click="handleDelete(doc.id)" :disabled="deleting === doc.id"
                class="p-1.5 border-2 border-transparent hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-black/30 hover:text-red-600 disabled:opacity-50">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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
