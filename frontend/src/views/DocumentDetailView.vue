<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents.store'
import type { Document, DocumentStatus } from '@/types/document'

const route = useRoute()
const router = useRouter()
const store = useDocumentsStore()

const doc = ref<Document | null>(null)
const loading = ref(true)
const tagInput = ref('')
const savingTags = ref(false)
const deleting = ref(false)

const statusConfig: Record<DocumentStatus, { label: string; classes: string }> = {
  UPLOADING: { label: 'Uploading', classes: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'Processing', classes: 'bg-yellow-100 text-yellow-700' },
  READY: { label: 'Ready', classes: 'bg-green-100 text-green-700' },
  ERROR: { label: 'Error', classes: 'bg-red-100 text-red-700' },
}

onMounted(async () => {
  const id = route.params.id as string
  // prefer store cache
  doc.value = store.documents.find(d => d.id === id) ?? null
  if (!doc.value) {
    try {
      const { documentsService } = await import('@/services/documents.service')
      doc.value = await documentsService.get(id)
    } catch {
      router.push('/documents')
    }
  }
  loading.value = false

  if (doc.value?.status === 'PROCESSING') {
    store.pollStatus(doc.value.id)
  }
})

const tags = computed(() => doc.value?.tags ?? [])

function addTag() {
  const t = tagInput.value.trim().toLowerCase()
  if (!t || tags.value.includes(t)) { tagInput.value = ''; return }
  doc.value!.tags = [...tags.value, t]
  tagInput.value = ''
  saveTags()
}

function removeTag(tag: string) {
  doc.value!.tags = tags.value.filter(t => t !== tag)
  saveTags()
}

async function saveTags() {
  if (!doc.value) return
  savingTags.value = true
  try {
    const { documentsService } = await import('@/services/documents.service')
    await documentsService.updateTags(doc.value.id, doc.value.tags)
  } finally {
    savingTags.value = false
  }
}

async function handleDelete() {
  if (!doc.value || !confirm('Delete this document?')) return
  deleting.value = true
  try {
    await store.removeDocument(doc.value.id)
    router.push('/documents')
  } finally {
    deleting.value = false
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="p-8 max-w-3xl">
    <div class="flex items-center gap-3 mb-8">
      <router-link to="/documents" class="text-gray-400 hover:text-gray-700 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900 truncate">{{ doc?.original_name ?? 'Document' }}</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <template v-else-if="doc">
      <!-- Status banner for PROCESSING -->
      <div v-if="doc.status === 'PROCESSING'" class="mb-6 flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
        <div class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
        <p class="text-sm text-yellow-800 font-medium">Processing document — chunks will be ready shortly</p>
      </div>
      <div v-if="doc.status === 'ERROR'" class="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        <p class="text-sm text-red-800 font-medium">Processing failed</p>
        <p v-if="doc.error_message" class="text-xs text-red-600 mt-0.5">{{ doc.error_message }}</p>
      </div>

      <!-- Info card -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
            <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusConfig[doc.status].classes]">
              {{ statusConfig[doc.status].label }}
            </span>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Size</p>
            <p class="text-sm text-gray-900">{{ formatSize(doc.size_bytes) }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Type</p>
            <p class="text-sm text-gray-900">{{ doc.mime_type }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Pages</p>
            <p class="text-sm text-gray-900">{{ doc.page_count ?? '—' }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Chunks</p>
            <p class="text-sm text-gray-900">{{ doc.chunk_count ?? '—' }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Processed</p>
            <p class="text-sm text-gray-900">{{ formatDate(doc.processed_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-900">Tags</h2>
          <span v-if="savingTags" class="text-xs text-gray-400">Saving…</span>
        </div>
        <div class="flex flex-wrap gap-2 mb-3">
          <span
            v-for="tag in tags"
            :key="tag"
            class="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full"
          >
            {{ tag }}
            <button @click="removeTag(tag)" class="hover:text-indigo-900 ml-0.5">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </span>
          <span v-if="tags.length === 0" class="text-xs text-gray-400">No tags yet</span>
        </div>
        <div class="flex gap-2">
          <input
            v-model="tagInput"
            @keydown.enter.prevent="addTag"
            type="text"
            placeholder="Add a tag…"
            class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            @click="addTag"
            class="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="bg-white rounded-xl border border-red-200 p-6">
        <h2 class="text-sm font-semibold text-red-700 mb-3">Danger Zone</h2>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-700">Delete this document</p>
            <p class="text-xs text-gray-400 mt-0.5">This will also remove it from all chat rooms.</p>
          </div>
          <button
            @click="handleDelete"
            :disabled="deleting"
            class="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
