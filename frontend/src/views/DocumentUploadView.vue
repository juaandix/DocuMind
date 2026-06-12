<script setup lang="ts">
import { ref } from 'vue'
import { useDocumentsStore } from '@/stores/documents.store'

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
  error.value = ''; uploading.value = true; progress.value = 0
  try {
    const doc = await store.upload(file)
    uploadedDocId.value = doc.id
    store.pollStatus(doc.id)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Upload failed'
  } finally { uploading.value = false; progress.value = 100; if (fileInput.value) fileInput.value.value = '' }
}
</script>

<template>
  <div class="p-8 max-w-2xl">
    <div class="flex items-center gap-3 mb-8">
      <router-link to="/documents" class="text-black dark:text-white hover:text-yellow-600 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <h1 class="text-3xl font-black uppercase tracking-tight text-black dark:text-white">Upload Document</h1>
    </div>

    <div v-if="uploadedDocId" class="relative">
      <div class="absolute inset-0 translate-x-2 translate-y-2 bg-green-500"></div>
      <div class="relative bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-8 text-center">
        <div class="w-16 h-16 bg-green-500 border-2 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 class="text-xl font-black uppercase text-black dark:text-white mb-2">Upload Successful!</h2>
        <p class="text-sm font-medium text-black/60 dark:text-white/60 mb-6">Document is being processed. This may take a moment.</p>
        <div class="flex justify-center gap-3">
          <router-link :to="`/documents/${uploadedDocId}`"
            class="bg-yellow-400 text-black font-black text-xs uppercase tracking-widest px-5 py-2.5 border-2 border-black shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            View Document
          </router-link>
          <button @click="uploadedDocId = null; progress = 0"
            class="bg-white dark:bg-neutral-900 text-black dark:text-white font-black text-xs uppercase tracking-widest px-5 py-2.5 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            Upload Another
          </button>
        </div>
      </div>
    </div>

    <div v-else class="space-y-5">
      <div @dragover.prevent="dragActive = true" @dragleave.prevent="dragActive = false" @drop.prevent="onDrop" @click="fileInput?.click()"
        :class="[
          'border-4 border-dashed p-14 text-center cursor-pointer transition-all',
          dragActive ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-black dark:border-white hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-neutral-800',
          uploading ? 'pointer-events-none opacity-60' : ''
        ]">
        <input ref="fileInput" type="file" :accept="ACCEPTED" class="hidden" @change="onFileChange" />
        <div v-if="!uploading">
          <div class="w-16 h-16 bg-black dark:bg-yellow-400 border-2 border-black shadow-[6px_6px_0_0_#facc15] dark:shadow-[6px_6px_0_0_#000] flex items-center justify-center mx-auto mb-5">
            <svg class="w-8 h-8 text-yellow-400 dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
            </svg>
          </div>
          <p class="text-lg font-black uppercase text-black dark:text-white">Drop your file here</p>
          <p class="text-sm font-bold text-black/50 dark:text-white/50 mt-1">or <span class="underline">click to browse</span></p>
          <p class="text-xs font-bold uppercase text-black/30 dark:text-white/30 mt-3 tracking-widest">PDF · DOCX · TXT · MD — max 50 MB</p>
        </div>
        <div v-else class="space-y-4">
          <div class="w-12 h-12 border-4 border-black dark:border-white border-t-yellow-400 dark:border-t-yellow-400 rounded-full animate-spin mx-auto"></div>
          <p class="text-sm font-black uppercase text-black dark:text-white tracking-widest">Uploading...</p>
          <div class="h-2 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 max-w-xs mx-auto overflow-hidden">
            <div class="h-full bg-yellow-400 transition-all" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>
      <p v-if="error" class="text-sm font-bold text-red-700 dark:text-red-400 border-2 border-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3">{{ error }}</p>
    </div>
  </div>
</template>
