<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useDocumentsStore } from '@/stores/documents.store'
import { useRoomsStore } from '@/stores/rooms.store'
import { useWorkspaceStore } from '@/stores/workspace.store'

const auth = useAuthStore()
const docsStore = useDocumentsStore()
const roomsStore = useRoomsStore()
const wsStore = useWorkspaceStore()

onMounted(async () => {
  await Promise.all([docsStore.fetchDocuments(), roomsStore.fetchRooms(), wsStore.fetchWorkspace()])
})

const readyDocs = computed(() => docsStore.documents.filter(d => d.status === 'READY'))
const processingDocs = computed(() => docsStore.documents.filter(d => d.status === 'PROCESSING'))
const recentDocs = computed(() => docsStore.documents.slice(0, 5))
const recentRooms = computed(() => roomsStore.rooms.slice(0, 4))

const storagePercent = computed(() => {
  const ws = wsStore.workspace
  if (!ws || !ws.storage_limit_bytes) return 0
  return Math.min(100, Math.round((ws.storage_used_bytes / ws.storage_limit_bytes) * 100))
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="p-8 max-w-6xl">
    <!-- Header -->
    <div class="mb-8 flex items-end justify-between">
      <div>
        <p class="text-xs font-black text-black/40 dark:text-white/40 uppercase tracking-widest mb-1">{{ wsStore.workspace?.name ?? 'Workspace' }}</p>
        <h1 class="text-4xl font-black uppercase tracking-tight text-black dark:text-white leading-none">
          {{ auth.user?.full_name?.split(' ')[0] ?? 'Hey' }},<br/>
          <span class="text-yellow-500">What's up?</span>
        </h1>
      </div>
      <div class="flex gap-3 mb-1">
        <router-link
          to="/documents/upload"
          class="inline-flex items-center gap-2 bg-yellow-400 text-black font-black text-xs uppercase tracking-widest px-4 py-2.5 border-2 border-black shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
          </svg>
          Upload
        </router-link>
        <router-link
          to="/rooms/new"
          class="inline-flex items-center gap-2 bg-white dark:bg-neutral-900 text-black dark:text-white font-black text-xs uppercase tracking-widest px-4 py-2.5 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          New Room
        </router-link>
      </div>
    </div>

    <!-- Stats row (bento) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Documents -->
      <div class="bg-black text-white border-2 border-black shadow-[4px_4px_0_0_#facc15] p-5">
        <p class="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Documents</p>
        <p class="text-5xl font-black leading-none">{{ docsStore.documents.length }}</p>
        <p class="text-xs font-bold text-green-400 mt-3 uppercase">{{ readyDocs.length }} ready</p>
      </div>

      <!-- Chat Rooms -->
      <div class="bg-yellow-400 border-2 border-black shadow-[4px_4px_0_0_#000] p-5">
        <p class="text-[10px] font-black uppercase tracking-widest text-black/50 mb-2">Chat Rooms</p>
        <p class="text-5xl font-black text-black leading-none">{{ roomsStore.rooms.length }}</p>
        <router-link to="/rooms/new" class="text-xs font-black text-black/60 mt-3 uppercase flex items-center gap-1 hover:text-black">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          New room
        </router-link>
      </div>

      <!-- Processing -->
      <div class="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] p-5">
        <p class="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Processing</p>
        <div class="flex items-end gap-2">
          <p class="text-5xl font-black text-black dark:text-white leading-none">{{ processingDocs.length }}</p>
          <div v-if="processingDocs.length > 0" class="mb-2 w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
        </div>
        <p class="text-xs font-bold text-black/40 dark:text-white/40 mt-3 uppercase">In pipeline</p>
      </div>

      <!-- Storage -->
      <div class="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] p-5">
        <p class="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Storage</p>
        <p class="text-5xl font-black text-black dark:text-white leading-none">
          {{ storagePercent }}<span class="text-2xl text-black/30 dark:text-white/30">%</span>
        </p>
        <div class="h-2 bg-black/10 dark:bg-white/10 mt-3 overflow-hidden border border-black/20 dark:border-white/20">
          <div
            :class="['h-full transition-all', storagePercent > 85 ? 'bg-red-500' : 'bg-yellow-400']"
            :style="{ width: `${storagePercent}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Content row -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <!-- Recent Documents -->
      <div class="lg:col-span-3 bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
        <div class="flex items-center justify-between px-5 py-3 border-b-2 border-black dark:border-white">
          <h2 class="text-xs font-black uppercase tracking-widest text-black dark:text-white">Recent Documents</h2>
          <router-link to="/documents" class="text-xs font-black uppercase tracking-widest text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white underline">View all</router-link>
        </div>

        <div v-if="recentDocs.length === 0" class="px-5 py-10 text-center">
          <p class="text-sm font-black uppercase text-black/30 dark:text-white/30">No documents yet</p>
          <router-link to="/documents/upload" class="text-xs font-black uppercase text-yellow-600 hover:underline mt-2 block">Upload one →</router-link>
        </div>

        <div v-else class="divide-y-2 divide-black/10 dark:divide-white/10">
          <div
            v-for="doc in recentDocs"
            :key="doc.id"
            class="flex items-center gap-3 px-5 py-3 hover:bg-yellow-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <div class="w-8 h-8 bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-yellow-400 dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <router-link :to="`/documents/${doc.id}`" class="text-sm font-bold text-black dark:text-white hover:underline truncate block">
                {{ doc.original_name }}
              </router-link>
              <p class="text-xs font-medium text-black/40 dark:text-white/40">{{ formatSize(doc.size_bytes) }} · {{ formatDate(doc.created_at) }}</p>
            </div>
            <span :class="[
              'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border-2',
              doc.status === 'READY' ? 'border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20' :
              doc.status === 'PROCESSING' ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' :
              doc.status === 'ERROR' ? 'border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20' :
              'border-black/30 text-black/50 dark:text-white/50'
            ]">{{ doc.status }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Rooms -->
      <div class="lg:col-span-2 bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
        <div class="flex items-center justify-between px-5 py-3 border-b-2 border-black dark:border-white">
          <h2 class="text-xs font-black uppercase tracking-widest text-black dark:text-white">Chat Rooms</h2>
          <router-link to="/rooms" class="text-xs font-black uppercase tracking-widest text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white underline">View all</router-link>
        </div>

        <div v-if="recentRooms.length === 0" class="px-5 py-10 text-center">
          <p class="text-sm font-black uppercase text-black/30 dark:text-white/30">No rooms yet</p>
          <router-link to="/rooms/new" class="text-xs font-black uppercase text-yellow-600 hover:underline mt-2 block">Create one →</router-link>
        </div>

        <div v-else class="divide-y-2 divide-black/10 dark:divide-white/10">
          <div
            v-for="room in recentRooms"
            :key="room.id"
            class="flex items-center gap-3 px-5 py-3 hover:bg-yellow-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <div class="w-8 h-8 bg-yellow-400 border-2 border-black flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <router-link :to="`/rooms/${room.id}`" class="text-sm font-bold text-black dark:text-white hover:underline truncate block">
                {{ room.name }}
              </router-link>
              <p class="text-xs font-medium text-black/40 dark:text-white/40">{{ room.document_ids.length }} doc{{ room.document_ids.length !== 1 ? 's' : '' }}</p>
            </div>
            <router-link :to="`/rooms/${room.id}`" class="text-xs font-black uppercase text-black dark:text-white hover:underline">Open →</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
