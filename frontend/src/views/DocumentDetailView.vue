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

const statusConfig: Record<DocumentStatus, { label: string; badge: string }> = {
  UPLOADING: { label: 'Uploading', badge: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  PROCESSING: { label: 'Processing', badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  READY: { label: 'Ready', badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  ERROR: { label: 'Error', badge: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' },
}

onMounted(async () => {
  const id = route.params.id as string
  doc.value = store.documents.find(d => d.id === id) ?? null
  if (!doc.value) {
    try {
      const { documentsService } = await import('@/services/documents.service')
      doc.value = await documentsService.get(id)
    } catch { router.push('/documents') }
  }
  loading.value = false
  if (doc.value?.status === 'PROCESSING') store.pollStatus(doc.value.id)
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
  } finally { savingTags.value = false }
}

async function handleDelete() {
  if (!doc.value || !confirm('Delete this document?')) return
  deleting.value = true
  try { await store.removeDocument(doc.value.id); router.push('/documents') }
  finally { deleting.value = false }
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
      <router-link to="/documents" class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <h1 class="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{{ doc?.original_name ?? 'Document' }}</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-8 h-8 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 rounded-full animate-spin"></div>
    </div>

    <template v-else-if="doc">
      <!-- Status banners -->
      <div v-if="doc.status === 'PROCESSING'" class="mb-5 flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3">
        <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
        <p class="text-sm text-amber-800 dark:text-amber-300 font-medium">Processing — chunks will be ready shortly</p>
      </div>
      <div v-if="doc.status === 'ERROR'" class="mb-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
        <p class="text-sm text-red-800 dark:text-red-400 font-medium">Processing failed</p>
        <p v-if="doc.error_message" class="text-xs text-red-600 dark:text-red-500 mt-0.5">{{ doc.error_message }}</p>
      </div>

      <!-- Info grid -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-5">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Status</p>
            <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', statusConfig[doc.status].badge]">
              {{ statusConfig[doc.status].label }}
            </span>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Size</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ formatSize(doc.size_bytes) }}</p>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Type</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ doc.mime_type }}</p>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Pages</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ doc.page_count ?? '—' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Chunks</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ doc.chunk_count ?? '—' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Processed</p>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ formatDate(doc.processed_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Tags</h2>
          <span v-if="savingTags" class="text-xs text-slate-400 dark:text-slate-500">Saving…</span>
        </div>
        <div class="flex flex-wrap gap-2 mb-4">
          <span
            v-for="tag in tags"
            :key="tag"
            class="inline-flex items-center gap-1 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-medium px-3 py-1 rounded-full border border-violet-100 dark:border-violet-500/20"
          >
            {{ tag }}
            <button @click="removeTag(tag)" class="hover:text-violet-900 dark:hover:text-violet-300 ml-0.5">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </span>
          <span v-if="tags.length === 0" class="text-xs text-slate-400 dark:text-slate-500">No tags yet</span>
        </div>
        <div class="flex gap-2">
          <input
            v-model="tagInput"
            @keydown.enter.prevent="addTag"
            type="text"
            placeholder="Add a tag…"
            class="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors"
          />
          <button
            @click="addTag"
            class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-500/20 p-6">
        <h2 class="text-sm font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-700 dark:text-slate-300 font-medium">Delete this document</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">This will also remove it from all chat rooms.</p>
          </div>
          <button
            @click="handleDelete"
            :disabled="deleting"
            class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
          >
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
