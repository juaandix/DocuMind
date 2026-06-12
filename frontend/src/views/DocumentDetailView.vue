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

const statusConfig: Record<DocumentStatus, { label: string; cls: string }> = {
  UPLOADING: { label: 'Uploading', cls: 'bg-[#0071e3]/[0.08] text-[#0071e3] dark:text-[#2997ff]' },
  PROCESSING: { label: 'Processing', cls: 'bg-[#ff9f0a]/[0.1] text-[#b86d00] dark:text-[#ffd60a]' },
  READY: { label: 'Ready', cls: 'bg-[#34c759]/[0.1] text-[#248a3d] dark:text-[#30d158]' },
  ERROR: { label: 'Error', cls: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' },
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
    <div v-if="loading" class="flex items-center gap-3 py-20">
      <div class="w-5 h-5 border-2 border-[#0071e3]/30 border-t-[#0071e3] rounded-full animate-spin"></div>
      <span class="text-sm text-[#6e6e73]">Loading…</span>
    </div>

    <template v-else-if="doc">
      <div class="flex items-center gap-2 mb-6">
        <router-link to="/documents" class="text-[#6e6e73] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </router-link>
        <h1 class="text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] truncate">{{ doc.original_name }}</h1>
      </div>

      <div v-if="doc.status === 'PROCESSING'" class="mb-4 flex items-center gap-3 bg-[#ff9f0a]/[0.08] border border-[#ff9f0a]/30 rounded-xl px-4 py-3">
        <div class="w-2 h-2 rounded-full bg-[#ff9f0a] animate-pulse flex-shrink-0"></div>
        <p class="text-sm text-[#b86d00] dark:text-[#ffd60a]">Processing — chunks will be ready shortly</p>
      </div>
      <div v-if="doc.status === 'ERROR'" class="mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
        <p class="text-sm font-medium text-red-700 dark:text-red-400">Processing failed</p>
        <p v-if="doc.error_message" class="text-xs text-red-500 mt-0.5">{{ doc.error_message }}</p>
      </div>

      <!-- Info grid -->
      <div class="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none p-5 mb-4">
        <h2 class="text-xs font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-wider mb-4">Document Info</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-5">
          <div>
            <p class="text-[10px] font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-widest mb-1.5">Status</p>
            <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', statusConfig[doc.status].cls]">
              {{ statusConfig[doc.status].label }}
            </span>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-widest mb-1.5">Size</p>
            <p class="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{{ formatSize(doc.size_bytes) }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-widest mb-1.5">Type</p>
            <p class="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{{ doc.mime_type }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-widest mb-1.5">Pages</p>
            <p class="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{{ doc.page_count ?? '—' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-widest mb-1.5">Chunks</p>
            <p class="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{{ doc.chunk_count ?? '—' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-widest mb-1.5">Processed</p>
            <p class="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{{ formatDate(doc.processed_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div class="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none p-5 mb-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xs font-semibold text-[#6e6e73] dark:text-[#98989d] uppercase tracking-wider">Tags</h2>
          <span v-if="savingTags" class="text-xs text-[#6e6e73]">Saving…</span>
        </div>
        <div class="flex flex-wrap gap-1.5 mb-4 min-h-[2rem]">
          <span v-for="tag in tags" :key="tag"
            class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#0071e3]/[0.08] dark:bg-[#2997ff]/[0.12] text-[#0071e3] dark:text-[#2997ff]">
            {{ tag }}
            <button @click="removeTag(tag)" class="hover:text-red-500 transition-colors ml-0.5">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </span>
          <span v-if="tags.length === 0" class="text-xs text-[#6e6e73] dark:text-[#98989d]">No tags yet</span>
        </div>
        <div class="flex gap-2">
          <input v-model="tagInput" @keydown.enter.prevent="addTag" type="text" placeholder="Add a tag…"
            class="flex-1 rounded-lg border border-black/[0.12] dark:border-white/[0.1] bg-[#f5f5f7] dark:bg-[#3a3a3c] px-3 py-2 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3]"
          />
          <button @click="addTag"
            class="bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors">
            Add
          </button>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none p-5 border border-red-200/50 dark:border-red-500/20">
        <h2 class="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-4">Danger Zone</h2>
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">Delete this document</p>
            <p class="text-xs text-[#6e6e73] dark:text-[#98989d] mt-0.5">This will also remove it from all chat rooms.</p>
          </div>
          <button @click="handleDelete" :disabled="deleting"
            class="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50 transition-colors">
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
