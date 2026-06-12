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
        <h1 class="text-2xl font-semibold text-[#1d1d1f]">Chat Rooms</h1>
        <p class="text-sm text-[#6e6e73] mt-0.5">{{ roomsStore.rooms.length }} rooms</p>
      </div>
      <router-link to="/rooms/new"
        class="inline-flex items-center gap-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium rounded-lg px-4 py-2 shadow-[0_1px_3px_rgba(0,113,227,0.4)] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        New Room
      </router-link>
    </div>

    <div v-if="roomsStore.rooms.length === 0" class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div class="w-14 h-14 rounded-2xl bg-[#34c759]/[0.1] flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      </div>
      <p class="text-base font-medium text-[#1d1d1f]">No chat rooms yet</p>
      <router-link to="/rooms/new" class="text-sm text-[#0071e3] hover:underline mt-2">Create your first room</router-link>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="room in roomsStore.rooms" :key="room.id"
        class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all group overflow-hidden">

        <div class="flex items-start justify-between p-4 border-b border-black/[0.04]">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-[#34c759]/[0.1] flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <router-link :to="`/rooms/${room.id}`" class="flex-1 min-w-0">
              <h3 class="text-sm font-semibold text-[#1d1d1f] truncate hover:text-[#0071e3] transition-colors">{{ room.name }}</h3>
            </router-link>
          </div>
          <button @click="handleDelete(room.id)" :disabled="deleting === room.id"
            class="ml-2 p-1.5 rounded-lg text-[#6e6e73] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <div class="p-4">
          <div class="flex flex-wrap gap-1.5 mb-4 min-h-[1.5rem]">
            <span v-for="docId in room.document_ids.slice(0, 3)" :key="docId"
              class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] truncate max-w-[10rem]">
              {{ docName(docId) }}
            </span>
            <span v-if="room.document_ids.length > 3"
              class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#6e6e73]">
              +{{ room.document_ids.length - 3 }}
            </span>
            <span v-if="room.document_ids.length === 0" class="text-xs text-[#6e6e73]">No documents attached</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-[#6e6e73]">{{ formatDate(room.created_at) }}</span>
            <router-link :to="`/rooms/${room.id}`" class="text-xs font-medium text-[#0071e3] hover:underline">Open →</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
