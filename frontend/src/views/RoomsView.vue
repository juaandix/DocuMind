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
  if (!confirm('Delete this room?')) return
  deleting.value = id
  try { const { roomsService } = await import('@/services/rooms.service'); await roomsService.delete(id); await roomsStore.fetchRooms() }
  finally { deleting.value = null }
}
</script>

<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-black uppercase tracking-tight text-black dark:text-white">Chat Rooms</h1>
        <p class="text-sm font-bold text-black/40 dark:text-white/40 mt-1 uppercase">{{ roomsStore.rooms.length }} rooms</p>
      </div>
      <router-link to="/rooms/new"
        class="inline-flex items-center gap-2 bg-yellow-400 text-black font-black text-xs uppercase tracking-widest px-4 py-2.5 border-2 border-black shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        New Room
      </router-link>
    </div>

    <div v-if="roomsStore.rooms.length === 0" class="text-center py-20 border-4 border-dashed border-black/20 dark:border-white/20">
      <p class="text-xl font-black uppercase text-black/30 dark:text-white/30">No Chat Rooms Yet</p>
      <router-link to="/rooms/new" class="text-sm font-black uppercase text-yellow-600 hover:underline mt-3 block">Create your first room →</router-link>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="room in roomsStore.rooms" :key="room.id"
        class="relative bg-white dark:bg-neutral-900 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] group">

        <div class="flex items-start justify-between p-4 border-b-2 border-black/10 dark:border-white/10">
          <div class="flex items-center gap-2.5 flex-1 min-w-0">
            <div class="w-8 h-8 bg-yellow-400 border-2 border-black flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <router-link :to="`/rooms/${room.id}`" class="flex-1 min-w-0">
              <h3 class="font-black text-sm uppercase text-black dark:text-white truncate hover:underline">{{ room.name }}</h3>
            </router-link>
          </div>
          <button @click="handleDelete(room.id)" :disabled="deleting === room.id"
            class="ml-2 p-1 border-2 border-transparent hover:border-red-500 text-black/20 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <div class="p-4">
          <div class="flex flex-wrap gap-1 mb-4 min-h-[1.5rem]">
            <span v-for="docId in room.document_ids.slice(0, 3)" :key="docId"
              class="text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black/30 dark:border-white/30 text-black/60 dark:text-white/60 truncate max-w-[10rem]">
              {{ docName(docId) }}
            </span>
            <span v-if="room.document_ids.length > 3"
              class="text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black/20 dark:border-white/20 text-black/40 dark:text-white/40">
              +{{ room.document_ids.length - 3 }}
            </span>
            <span v-if="room.document_ids.length === 0" class="text-xs font-bold text-black/30 dark:text-white/30 uppercase">No docs</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-black/40 dark:text-white/40 uppercase">{{ formatDate(room.created_at) }}</span>
            <router-link :to="`/rooms/${room.id}`" class="text-xs font-black uppercase text-black dark:text-white border-b-2 border-black dark:border-white hover:text-yellow-600 hover:border-yellow-600">
              Open →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
