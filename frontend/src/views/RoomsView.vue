<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoomsStore } from '@/stores/rooms.store'
import { useDocumentsStore } from '@/stores/documents.store'

const roomsStore = useRoomsStore()
const docsStore = useDocumentsStore()
const deleting = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([roomsStore.fetchRooms(), docsStore.fetchDocuments()])
})

function docName(id: string) {
  return docsStore.documents.find(d => d.id === id)?.original_name ?? id
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function handleDelete(id: string) {
  if (!confirm('Delete this room and all its messages?')) return
  deleting.value = id
  try {
    const { roomsService } = await import('@/services/rooms.service')
    await roomsService.delete(id)
    await roomsStore.fetchRooms()
  } finally {
    deleting.value = null
  }
}
</script>

<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Chat Rooms</h1>
        <p class="text-sm text-gray-500 mt-1">{{ roomsStore.rooms.length }} rooms in your workspace</p>
      </div>
      <router-link
        to="/rooms/new"
        class="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        New room
      </router-link>
    </div>

    <!-- Empty state -->
    <div v-if="roomsStore.rooms.length === 0" class="text-center py-16">
      <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
      </svg>
      <p class="text-gray-500 font-medium">No chat rooms yet</p>
      <p class="text-gray-400 text-sm mt-1">Create a room and attach documents to start chatting with AI</p>
      <router-link to="/rooms/new" class="mt-4 inline-block text-sm text-indigo-600 font-medium hover:underline">
        Create your first room →
      </router-link>
    </div>

    <!-- Room grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="room in roomsStore.rooms"
        :key="room.id"
        class="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
      >
        <div class="flex items-start justify-between mb-3">
          <router-link :to="`/rooms/${room.id}`" class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
              {{ room.name }}
            </h3>
          </router-link>
          <button
            @click="handleDelete(room.id)"
            :disabled="deleting === room.id"
            class="ml-2 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <!-- Attached docs -->
        <div class="flex flex-wrap gap-1 mb-4 min-h-[1.5rem]">
          <span
            v-for="docId in room.document_ids.slice(0, 3)"
            :key="docId"
            class="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded truncate max-w-[10rem]"
            :title="docName(docId)"
          >
            {{ docName(docId) }}
          </span>
          <span v-if="room.document_ids.length > 3" class="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded">
            +{{ room.document_ids.length - 3 }} more
          </span>
          <span v-if="room.document_ids.length === 0" class="text-xs text-gray-400">No documents attached</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">{{ formatDate(room.created_at) }}</span>
          <router-link
            :to="`/rooms/${room.id}`"
            class="text-sm text-indigo-600 font-medium hover:underline"
          >
            Open chat →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
