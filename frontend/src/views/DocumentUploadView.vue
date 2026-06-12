<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentsStore } from '@/stores/documents.store'

const router = useRouter()
const store = useDocumentsStore()

const dragActive = ref(false)
const uploading = ref(false)
const uploadedDocId = ref<string | null>(null)
const progress = ref(0)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const ACCEPTED = '.pdf,.doc,.docx,.txt,.md'

function onDrop(e: DragEvent) {
  dragActive.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) startUpload(file)
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) startUpload(file)
}

async function startUpload(file: File) {
  error.value = ''
  uploading.value = true
  progress.value = 0
  const tempId = `uploading-${Date.now()}`
  try {
    const doc = await store.upload(file)
    uploadedDocId.value = doc.id
    store.pollStatus(doc.id)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Upload failed'
  } finally {
    uploading.value = false
    progress.value = 100
    if (fileInput.value) fileInput.value.value = ''
    void tempId
  }
}
</script>

<template>
  <div class="p-8 max-w-2xl">
    <div class="flex items-center gap-3 mb-8">
      <router-link to="/documents" class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Upload Document</h1>
    </div>

    <!-- Success state -->
    <div v-if="uploadedDocId" class="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-8 text-center">
      <div class="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h2 class="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Upload successful!</h2>
      <p class="text-emerald-700 dark:text-emerald-400 text-sm mb-6">Your document is being processed. This may take a moment.</p>
      <div class="flex justify-center gap-3">
        <router-link
          :to="`/documents/${uploadedDocId}`"
          class="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          View document
        </router-link>
        <button
          @click="uploadedDocId = null; progress = 0"
          class="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
        >
          Upload another
        </button>
      </div>
    </div>

    <!-- Upload area -->
    <div v-else>
      <div
        @dragover.prevent="dragActive = true"
        @dragleave.prevent="dragActive = false"
        @drop.prevent="onDrop"
        @click="fileInput?.click()"
        :class="[
          'border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-200',
          dragActive ? 'border-violet-400 bg-violet-50 dark:bg-violet-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800/40',
          uploading ? 'pointer-events-none opacity-60' : ''
        ]"
      >
        <input ref="fileInput" type="file" :accept="ACCEPTED" class="hidden" @change="onFileChange" />

        <div v-if="!uploading">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
            </svg>
          </div>
          <p class="text-base font-semibold text-slate-700 dark:text-slate-300">Drag & drop a file here</p>
          <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">or <span class="text-violet-600 dark:text-violet-400 font-medium">click to browse</span></p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-3">PDF, Word, TXT, Markdown — max 50 MB</p>
        </div>

        <div v-else class="space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center mx-auto">
            <svg class="w-6 h-6 text-violet-600 dark:text-violet-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
            </svg>
          </div>
          <p class="text-sm font-semibold text-violet-700 dark:text-violet-400">Uploading…</p>
          <div class="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full max-w-xs mx-auto overflow-hidden">
            <div class="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>

      <p v-if="error" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ error }}</p>

      <div class="mt-5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Supported formats</p>
        <div class="flex flex-wrap gap-2">
          <span v-for="fmt in ['PDF', 'DOCX', 'DOC', 'TXT', 'MD']" :key="fmt"
            class="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400">
            {{ fmt }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
