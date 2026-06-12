<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomsStore } from '@/stores/rooms.store'
import { useDocumentsStore } from '@/stores/documents.store'

const router = useRouter()
const roomsStore = useRoomsStore()
const docsStore = useDocumentsStore()

const name = ref('')
const selectedIds = ref<string[]>([])
const creating = ref(false)
const error = ref('')

onMounted(() => docsStore.fetchDocuments())

const readyDocs = computed(() => docsStore.documents.filter(d => d.status === 'READY'))

function toggleDoc(id: string) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

async function submit() {
  if (!name.value.trim()) { error.value = 'Name is required'; return }
  error.value = ''
  creating.value = true
  try {
    const room = await roomsStore.createRoom(name.value.trim(), selectedIds.value)
    router.push(`/rooms/${room.id}`)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to create room'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="p-8 max-w-2xl">
    <div class="flex items-center gap-3 mb-8">
      <router-link to="/rooms" class="text-gray-400 hover:text-gray-700 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">New Chat Room</h1>
    </div>

    <form @submit.prevent="submit" class="space-y-6">
      <!-- Room name -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <label class="block text-sm font-semibold text-gray-700 mb-2">Room name</label>
        <input
          v-model="name"
          type="text"
          placeholder="e.g. Q4 Financial Report Analysis"
          required
          class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <!-- Document selection -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-semibold text-gray-700">Attach documents</label>
          <span class="text-xs text-gray-400">{{ selectedIds.length }} selected</span>
        </div>

        <div v-if="readyDocs.length === 0" class="text-center py-8 text-sm text-gray-400">
          No ready documents. <router-link to="/documents/upload" class="text-indigo-600 hover:underline">Upload one first</router-link>.
        </div>

        <div v-else class="space-y-2 max-h-64 overflow-y-auto">
          <label
            v-for="doc in readyDocs"
            :key="doc.id"
            :class="[
              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              selectedIds.includes(doc.id)
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-gray-200 hover:bg-gray-50'
            ]"
          >
            <input
              type="checkbox"
              :checked="selectedIds.includes(doc.id)"
              @change="toggleDoc(doc.id)"
              class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ doc.original_name }}</p>
              <p class="text-xs text-gray-400">{{ doc.chunk_count }} chunks</p>
            </div>
          </label>
        </div>

        <p class="text-xs text-gray-400 mt-3">You can add or remove documents later from the room settings.</p>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="creating"
          class="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {{ creating ? 'Creating…' : 'Create room' }}
        </button>
        <router-link
          to="/rooms"
          class="px-6 py-2.5 border border-gray-300 text-sm font-semibold text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
        >
          Cancel
        </router-link>
      </div>
    </form>
  </div>
</template>
