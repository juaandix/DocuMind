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

const statusColors: Record<string, string> = {
  READY: 'text-green-600',
  PROCESSING: 'text-yellow-600',
  ERROR: 'text-red-600',
  UPLOADING: 'text-blue-600',
}
</script>

<template>
  <div class="p-8">
    <!-- Greeting -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">
        Good {{ new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening' }},
        {{ auth.user?.full_name?.split(' ')[0] ?? 'there' }} 👋
      </h1>
      <p class="text-sm text-gray-500 mt-1">{{ wsStore.workspace?.name ?? 'Your workspace' }}</p>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Documents</p>
        <p class="text-3xl font-bold text-gray-900 mt-1">{{ docsStore.documents.length }}</p>
        <p class="text-xs text-green-600 mt-1 font-medium">{{ readyDocs.length }} ready</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Chat Rooms</p>
        <p class="text-3xl font-bold text-gray-900 mt-1">{{ roomsStore.rooms.length }}</p>
        <router-link to="/rooms/new" class="text-xs text-indigo-600 hover:underline mt-1 block font-medium">+ New room</router-link>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Processing</p>
        <div class="flex items-end gap-2 mt-1">
          <p class="text-3xl font-bold text-gray-900">{{ processingDocs.length }}</p>
          <div v-if="processingDocs.length > 0" class="mb-1 w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
        </div>
        <p class="text-xs text-gray-400 mt-1">In pipeline</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Storage</p>
        <p class="text-3xl font-bold text-gray-900 mt-1">{{ storagePercent }}<span class="text-lg text-gray-400">%</span></p>
        <div class="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
          <div
            :class="['h-full rounded-full', storagePercent > 85 ? 'bg-red-500' : 'bg-indigo-500']"
            :style="{ width: `${storagePercent}%` }"
          ></div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Documents -->
      <div class="bg-white rounded-xl border border-gray-200">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-900">Recent Documents</h2>
          <router-link to="/documents" class="text-xs text-indigo-600 hover:underline font-medium">View all</router-link>
        </div>
        <div v-if="recentDocs.length === 0" class="px-5 py-8 text-center text-sm text-gray-400">
          No documents yet.
          <router-link to="/documents/upload" class="text-indigo-600 hover:underline ml-1">Upload one</router-link>
        </div>
        <div v-else class="divide-y divide-gray-50">
          <div v-for="doc in recentDocs" :key="doc.id" class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
            <svg class="w-8 h-8 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <div class="flex-1 min-w-0">
              <router-link :to="`/documents/${doc.id}`" class="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block">
                {{ doc.original_name }}
              </router-link>
              <p class="text-xs text-gray-400">{{ formatSize(doc.size_bytes) }} · {{ formatDate(doc.created_at) }}</p>
            </div>
            <span :class="['text-xs font-medium', statusColors[doc.status]]">{{ doc.status }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Rooms -->
      <div class="bg-white rounded-xl border border-gray-200">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 class="text-sm font-semibold text-gray-900">Chat Rooms</h2>
          <router-link to="/rooms" class="text-xs text-indigo-600 hover:underline font-medium">View all</router-link>
        </div>
        <div v-if="recentRooms.length === 0" class="px-5 py-8 text-center text-sm text-gray-400">
          No rooms yet.
          <router-link to="/rooms/new" class="text-indigo-600 hover:underline ml-1">Create one</router-link>
        </div>
        <div v-else class="divide-y divide-gray-50">
          <div v-for="room in recentRooms" :key="room.id" class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
            <div class="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <router-link :to="`/rooms/${room.id}`" class="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block">
                {{ room.name }}
              </router-link>
              <p class="text-xs text-gray-400">{{ room.document_ids.length }} doc{{ room.document_ids.length !== 1 ? 's' : '' }} · {{ formatDate(room.created_at) }}</p>
            </div>
            <router-link :to="`/rooms/${room.id}`" class="text-xs text-indigo-600 font-medium hover:underline flex-shrink-0">
              Open →
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="mt-6 flex flex-wrap gap-3">
      <router-link
        to="/documents/upload"
        class="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
        </svg>
        Upload document
      </router-link>
      <router-link
        to="/rooms/new"
        class="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        New chat room
      </router-link>
    </div>
  </div>
</template>
