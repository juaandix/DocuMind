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
  await Promise.all([
    docsStore.fetchDocuments(),
    roomsStore.fetchRooms(),
    wsStore.fetchWorkspace(),
  ])
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

const statusDot: Record<string, string> = {
  READY: 'bg-emerald-500',
  PROCESSING: 'bg-amber-500 animate-pulse',
  ERROR: 'bg-red-500',
  UPLOADING: 'bg-blue-500',
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})
</script>

<template>
  <div class="p-8 max-w-6xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {{ greeting }}, {{ auth.user?.full_name?.split(' ')[0] ?? 'there' }}
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ wsStore.workspace?.name ?? 'Your workspace' }}</p>
    </div>

    <!-- Bento stats row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Documents -->
      <div class="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-violet-500 to-cyan-500 opacity-60"></div>
        <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Documents</p>
        <p class="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2 leading-none">{{ docsStore.documents.length }}</p>
        <p class="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {{ readyDocs.length }} ready
        </p>
      </div>

      <!-- Chat Rooms -->
      <div class="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-violet-500 to-cyan-500 opacity-60"></div>
        <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Chat Rooms</p>
        <p class="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2 leading-none">{{ roomsStore.rooms.length }}</p>
        <router-link to="/rooms/new" class="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 mt-2 flex items-center gap-1 font-medium">
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          New room
        </router-link>
      </div>

      <!-- Processing -->
      <div class="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-amber-500 to-orange-400 opacity-60" :class="processingDocs.length > 0 ? 'opacity-100' : 'opacity-30'"></div>
        <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Processing</p>
        <div class="flex items-end gap-2 mt-2">
          <p class="text-3xl font-bold text-slate-900 dark:text-slate-100 leading-none">{{ processingDocs.length }}</p>
          <div v-if="processingDocs.length > 0" class="mb-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
        </div>
        <p class="text-xs text-slate-400 dark:text-slate-500 mt-2">In pipeline</p>
      </div>

      <!-- Storage -->
      <div class="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div class="absolute top-0 inset-x-0 h-px opacity-60"
          :class="storagePercent > 85 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-violet-500 to-cyan-500'"></div>
        <p class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Storage</p>
        <p class="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2 leading-none">
          {{ storagePercent }}<span class="text-lg text-slate-400 dark:text-slate-500">%</span>
        </p>
        <div class="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all duration-500', storagePercent > 85 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-cyan-500']"
            :style="{ width: `${storagePercent}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Bento content row -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
      <!-- Recent Documents (larger) -->
      <div class="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent Documents</h2>
          <router-link to="/documents" class="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 font-medium transition-colors">View all →</router-link>
        </div>

        <div v-if="recentDocs.length === 0" class="px-5 py-10 text-center">
          <svg class="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          <p class="text-sm text-slate-400 dark:text-slate-500">No documents yet</p>
          <router-link to="/documents/upload" class="text-sm text-violet-600 dark:text-violet-400 hover:underline mt-1 block font-medium">Upload one →</router-link>
        </div>

        <div v-else class="divide-y divide-slate-50 dark:divide-slate-800/50">
          <div
            v-for="doc in recentDocs"
            :key="doc.id"
            class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
          >
            <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <router-link :to="`/documents/${doc.id}`" class="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 truncate block transition-colors">
                {{ doc.original_name }}
              </router-link>
              <p class="text-xs text-slate-400 dark:text-slate-500">{{ formatSize(doc.size_bytes) }} · {{ formatDate(doc.created_at) }}</p>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <span :class="['w-1.5 h-1.5 rounded-full', statusDot[doc.status]]"></span>
              <span class="text-xs text-slate-400 dark:text-slate-500">{{ doc.status === 'READY' ? 'Ready' : doc.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Rooms (smaller) -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Chat Rooms</h2>
          <router-link to="/rooms" class="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 font-medium transition-colors">View all →</router-link>
        </div>

        <div v-if="recentRooms.length === 0" class="px-5 py-10 text-center">
          <svg class="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <p class="text-sm text-slate-400 dark:text-slate-500">No rooms yet</p>
          <router-link to="/rooms/new" class="text-sm text-violet-600 dark:text-violet-400 hover:underline mt-1 block font-medium">Create one →</router-link>
        </div>

        <div v-else class="divide-y divide-slate-50 dark:divide-slate-800/50">
          <div
            v-for="room in recentRooms"
            :key="room.id"
            class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div class="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-3.5 h-3.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <router-link :to="`/rooms/${room.id}`" class="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 truncate block transition-colors">
                {{ room.name }}
              </router-link>
              <p class="text-xs text-slate-400 dark:text-slate-500">{{ room.document_ids.length }} doc{{ room.document_ids.length !== 1 ? 's' : '' }}</p>
            </div>
            <router-link :to="`/rooms/${room.id}`" class="text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline flex-shrink-0 transition-colors">
              Open
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="flex flex-wrap gap-3">
      <router-link
        to="/documents/upload"
        class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
        </svg>
        Upload document
      </router-link>
      <router-link
        to="/rooms/new"
        class="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        New chat room
      </router-link>
    </div>
  </div>
</template>
