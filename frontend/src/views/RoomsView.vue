<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoomsStore } from '@/stores/rooms.store'
import { useDocumentsStore } from '@/stores/documents.store'

const roomsStore = useRoomsStore()
const docsStore = useDocumentsStore()
const deleting = ref<string | null>(null)

onMounted(async () => { await Promise.all([roomsStore.fetchRooms(), docsStore.fetchDocuments()]) })

function docName(id: string) { return docsStore.documents.find(d => d.id === id)?.original_name ?? id }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }

async function handleDelete(id: string) {
  if (!confirm('Delete this room and all its messages?')) return
  deleting.value = id
  try { const { roomsService } = await import('@/services/rooms.service'); await roomsService.delete(id); await roomsStore.fetchRooms() }
  finally { deleting.value = null }
}
</script>

<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Chat Rooms</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ roomsStore.rooms.length }} rooms in your workspace</p>
      </div>
      <router-link
        to="/rooms/new"
        class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 transition-all"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        New room
      </router-link>
    </div>

    <!-- Empty state -->
    <div v-if="roomsStore.rooms.length === 0" class="text-center py-20">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      </div>
      <p class="text-slate-700 dark:text-slate-300 font-semibold">No chat rooms yet</p>
      <p class="text-slate-400 dark:text-slate-500 text-sm mt-1">Create a room and attach documents to start chatting with AI</p>
      <router-link to="/rooms/new" class="mt-4 inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline">
        Create your first room →
      </router-link>
    </div>

    <!-- Room grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="room in roomsStore.rooms"
        :key="room.id"
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-violet-200 dark:hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5 transition-all group"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2.5 flex-1 min-w-0">
            <div class="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <router-link :to="`/rooms/${room.id}`" class="flex-1 min-w-0">
              <h3 class="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                {{ room.name }}
              </h3>
            </router-link>
          </div>
          <button
            @click="handleDelete(room.id)"
            :disabled="deleting === room.id"
            class="ml-2 p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <div class="flex flex-wrap gap-1 mb-4 min-h-[1.5rem]">
          <span
            v-for="docId in room.document_ids.slice(0, 3)"
            :key="docId"
            class="inline-block bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-lg truncate max-w-[10rem]"
          >
            {{ docName(docId) }}
          </span>
          <span v-if="room.document_ids.length > 3" class="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 text-xs px-2 py-0.5 rounded-lg">
            +{{ room.document_ids.length - 3 }} more
          </span>
          <span v-if="room.document_ids.length === 0" class="text-xs text-slate-400 dark:text-slate-500">No documents attached</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-400 dark:text-slate-500">{{ formatDate(room.created_at) }}</span>
          <router-link :to="`/rooms/${room.id}`" class="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline transition-colors">
            Open chat →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
