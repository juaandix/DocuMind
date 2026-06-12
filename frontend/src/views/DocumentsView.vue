<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useDocumentsStore } from '@/stores/documents.store'
import type { DocumentStatus } from '@/types/document'

const store = useDocumentsStore()
const search = ref('')
const deleting = ref<string | null>(null)

onMounted(() => store.fetchDocuments())

const filtered = computed(() =>
  store.documents.filter(d =>
    d.original_name.toLowerCase().includes(search.value.toLowerCase())
  )
)

const statusConfig: Record<DocumentStatus, { label: string; classes: string }> = {
  UPLOADING: { label: 'Uploading', classes: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'Processing', classes: 'bg-yellow-100 text-yellow-700' },
  READY: { label: 'Ready', classes: 'bg-green-100 text-green-700' },
  ERROR: { label: 'Error', classes: 'bg-red-100 text-red-700' },
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
  try {
    await store.removeDocument(id)
  } finally {
    deleting.value = null
  }
}
</script>

<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Documents</h1>
        <p class="text-sm text-gray-500 mt-1">{{ store.documents.length }} documents in your workspace</p>
      </div>
      <router-link
        to="/documents/upload"
        class="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Upload
      </router-link>
    </div>

    <!-- Search -->
    <div class="relative mb-6">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        v-model="search"
        type="text"
        placeholder="Search documents…"
        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
      />
    </div>

    <!-- Empty state -->
    <div v-if="filtered.length === 0" class="text-center py-16">
      <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
      </svg>
      <p class="text-gray-500 font-medium">No documents yet</p>
      <p class="text-gray-400 text-sm mt-1">Upload your first document to get started</p>
      <router-link to="/documents/upload" class="mt-4 inline-block text-sm text-indigo-600 font-medium hover:underline">
        Upload a document →
      </router-link>
    </div>

    <!-- Document list -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Size</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-600">Uploaded</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="doc in filtered" :key="doc.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <router-link :to="`/documents/${doc.id}`" class="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                {{ doc.original_name }}
              </router-link>
              <div v-if="doc.chunk_count" class="text-xs text-gray-400 mt-0.5">{{ doc.chunk_count }} chunks</div>
            </td>
            <td class="px-4 py-3">
              <span :class="['inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', statusConfig[doc.status].classes]">
                <span v-if="doc.status === 'PROCESSING'" class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                {{ statusConfig[doc.status].label }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ formatSize(doc.size_bytes) }}</td>
            <td class="px-4 py-3 text-gray-500">{{ formatDate(doc.created_at) }}</td>
            <td class="px-4 py-3 text-right">
              <button
                @click="handleDelete(doc.id)"
                :disabled="deleting === doc.id"
                class="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                title="Delete"
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
