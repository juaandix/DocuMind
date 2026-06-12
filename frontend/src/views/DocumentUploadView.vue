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
    <div class="flex items-center gap-2 mb-6">
      <router-link to="/documents" class="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <h1 class="text-xl font-semibold text-[#1d1d1f]">Upload Document</h1>
    </div>

    <div v-if="uploadedDocId" class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-10 text-center">
      <div class="w-16 h-16 rounded-2xl bg-[#34c759]/[0.12] flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h2 class="text-lg font-semibold text-[#1d1d1f] mb-1">Upload successful</h2>
      <p class="text-sm text-[#6e6e73] mb-6">Your document is being processed. This may take a moment.</p>
      <div class="flex justify-center gap-3">
        <router-link :to="`/documents/${uploadedDocId}`"
          class="bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium rounded-lg px-5 py-2.5 shadow-[0_1px_3px_rgba(0,113,227,0.4)] transition-colors">
          View document
        </router-link>
        <button @click="uploadedDocId = null; progress = 0"
          class="bg-[#f5f5f7] hover:bg-gray-200 text-[#1d1d1f] text-sm font-medium rounded-lg px-5 py-2.5 transition-colors">
          Upload another
        </button>
      </div>
    </div>

    <div v-else class="space-y-4">
      <div @dragover.prevent="dragActive = true" @dragleave.prevent="dragActive = false" @drop.prevent="onDrop" @click="fileInput?.click()"
        :class="[
          'rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer transition-all',
          dragActive ? 'border-[#0071e3] bg-[#0071e3]/[0.04]' : 'border-black/[0.12] hover:border-[#0071e3] hover:bg-[#0071e3]/[0.02]',
          uploading ? 'pointer-events-none opacity-60' : ''
        ]">
        <input ref="fileInput" type="file" :accept="ACCEPTED" class="hidden" @change="onFileChange" />
        <div v-if="!uploading">
          <div class="w-14 h-14 rounded-2xl bg-[#0071e3]/[0.08] flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
            </svg>
          </div>
          <p class="text-base font-medium text-[#1d1d1f]">Drop your file here</p>
          <p class="text-sm text-[#6e6e73] mt-1">or <span class="text-[#0071e3]">browse to upload</span></p>
          <p class="text-xs text-[#6e6e73] mt-3">PDF · DOCX · TXT · MD — max 50 MB</p>
        </div>
        <div v-else class="space-y-4">
          <div class="w-10 h-10 border-2 border-[#0071e3]/20 border-t-[#0071e3] rounded-full animate-spin mx-auto"></div>
          <p class="text-sm font-medium text-[#1d1d1f]">Uploading…</p>
          <div class="h-1.5 bg-black/[0.06] rounded-full max-w-xs mx-auto overflow-hidden">
            <div class="h-full rounded-full bg-[#0071e3] transition-all" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>
      <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{{ error }}</p>
    </div>
  </div>
</template>
