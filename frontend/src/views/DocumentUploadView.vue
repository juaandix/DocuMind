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
    <!-- Header -->
    <div class="flex items-center gap-3 mb-8">
      <router-link to="/documents" class="text-gray-400 hover:text-gray-700 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">Upload Document</h1>
    </div>

    <!-- Success state -->
    <div v-if="uploadedDocId" class="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
      <svg class="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h2 class="text-lg font-semibold text-green-800 mb-1">Upload successful!</h2>
      <p class="text-green-700 text-sm mb-4">Your document is being processed. This may take a moment.</p>
      <div class="flex justify-center gap-3">
        <router-link
          :to="`/documents/${uploadedDocId}`"
          class="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          View document
        </router-link>
        <button
          @click="uploadedDocId = null; progress = 0"
          class="bg-white border border-green-300 text-green-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
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
          'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
          dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50',
          uploading ? 'pointer-events-none opacity-60' : ''
        ]"
      >
        <input
          ref="fileInput"
          type="file"
          :accept="ACCEPTED"
          class="hidden"
          @change="onFileChange"
        />

        <div v-if="!uploading">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
          </svg>
          <p class="text-base font-medium text-gray-700">Drag & drop a file here, or click to browse</p>
          <p class="text-sm text-gray-400 mt-1">PDF, Word, TXT, Markdown — max 50 MB</p>
        </div>

        <div v-else class="space-y-3">
          <svg class="w-10 h-10 text-indigo-500 mx-auto animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
          </svg>
          <p class="text-sm font-medium text-indigo-700">Uploading…</p>
          <div class="h-2 bg-gray-200 rounded-full max-w-xs mx-auto overflow-hidden">
            <div
              class="h-full bg-indigo-500 rounded-full transition-all duration-300"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>
      </div>

      <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>

      <div class="mt-6 bg-gray-50 rounded-lg p-4">
        <p class="text-sm font-medium text-gray-700 mb-2">Supported formats</p>
        <div class="flex flex-wrap gap-2">
          <span v-for="fmt in ['PDF', 'DOCX', 'DOC', 'TXT', 'MD']" :key="fmt"
            class="px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-600">
            {{ fmt }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
