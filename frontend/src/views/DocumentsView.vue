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

const statusConfig: Record<DocumentStatus, { label: string; dot: string; badge: string }> = {
  UPLOADING: { label: 'Uploading', dot: 'bg-blue-500', badge: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  PROCESSING: { label: 'Processing', dot: 'bg-amber-500 animate-pulse', badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  READY: { label: 'Ready', dot: 'bg-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  ERROR: { label: 'Error', dot: 'bg-red-500', badge: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' },
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function handleDelete(id: string) {
  if (!confirm('Delete this document? This cannot be undone.')) return
  deleting.value = id
  try { await store.removeDocument(id) } finally { deleting.value = null }
}
</script>

<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Documents</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ store.documents.length }} documents in your workspace</p>
      </div>
      <router-link
        to="/documents/upload"
        class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 transition-all"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Upload
      </router-link>
    </div>

    <!-- Search -->
    <div class="relative mb-6">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        v-model="search"
        type="text"
        placeholder="Search documents…"
        class="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors"
      />
    </div>

    <!-- Empty state -->
    <div v-if="filtered.length === 0" class="text-center py-20">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
      </div>
      <p class="text-slate-700 dark:text-slate-300 font-semibold">No documents found</p>
      <p class="text-slate-400 dark:text-slate-500 text-sm mt-1">{{ search ? 'Try a different search' : 'Upload your first document to get started' }}</p>
      <router-link v-if="!search" to="/documents/upload" class="mt-4 inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline">
        Upload a document →
      </router-link>
    </div>

    <!-- Document table -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Size</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uploaded</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr v-for="doc in filtered" :key="doc.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
            <td class="px-4 py-3">
              <router-link :to="`/documents/${doc.id}`" class="font-medium text-slate-800 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                {{ doc.original_name }}
              </router-link>
              <div v-if="doc.chunk_count" class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{{ doc.chunk_count }} chunks</div>
            </td>
            <td class="px-4 py-3">
              <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusConfig[doc.status].badge]">
                <span :class="['w-1.5 h-1.5 rounded-full flex-shrink-0', statusConfig[doc.status].dot]"></span>
                {{ statusConfig[doc.status].label }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{{ formatSize(doc.size_bytes) }}</td>
            <td class="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{{ formatDate(doc.created_at) }}</td>
            <td class="px-4 py-3 text-right">
              <button
                @click="handleDelete(doc.id)"
                :disabled="deleting === doc.id"
                class="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
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
