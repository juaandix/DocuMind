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
  if (selectedIds.value.includes(id)) selectedIds.value = selectedIds.value.filter(i => i !== id)
  else selectedIds.value = [...selectedIds.value, id]
}

async function submit() {
  if (!name.value.trim()) { error.value = 'Name is required'; return }
  error.value = ''; creating.value = true
  try {
    const room = await roomsStore.createRoom(name.value.trim(), selectedIds.value)
    router.push(`/rooms/${room.id}`)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed'
  } finally { creating.value = false }
}
</script>

<template>
  <div class="p-8 max-w-2xl">
    <div class="flex items-center gap-2 mb-6">
      <router-link to="/rooms" class="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <h1 class="text-xl font-semibold text-[#1d1d1f]">New Chat Room</h1>
    </div>

    <form @submit.prevent="submit" class="space-y-4">
      <div class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5">
        <label class="block text-xs font-semibold text-[#6e6e73] uppercase tracking-wider mb-2">Room Name</label>
        <input v-model="name" type="text" placeholder="e.g. Q4 Financial Report Analysis" required
          class="w-full rounded-lg border border-black/[0.12] bg-[#f5f5f7] px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 focus:border-[#0071e3]"
        />
      </div>

      <div class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-5">
        <div class="flex items-center justify-between mb-4">
          <label class="text-xs font-semibold text-[#6e6e73] uppercase tracking-wider">Attach Documents</label>
          <span v-if="selectedIds.length > 0" class="text-xs font-medium px-2 py-0.5 rounded-full bg-[#0071e3]/[0.08] text-[#0071e3]">
            {{ selectedIds.length }} selected
          </span>
        </div>

        <div v-if="readyDocs.length === 0" class="text-center py-8 rounded-xl bg-[#f5f5f7]">
          <p class="text-sm text-[#6e6e73]">No ready documents available</p>
          <router-link to="/documents/upload" class="text-xs text-[#0071e3] hover:underline mt-1.5 block">Upload a document first</router-link>
        </div>

        <div v-else class="space-y-1.5 max-h-64 overflow-y-auto">
          <label v-for="doc in readyDocs" :key="doc.id"
            :class="[
              'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
              selectedIds.includes(doc.id)
                ? 'bg-[#0071e3]/[0.08]'
                : 'hover:bg-[#f5f5f7]'
            ]"
          >
            <input type="checkbox" :checked="selectedIds.includes(doc.id)" @change="toggleDoc(doc.id)"
              class="w-4 h-4 rounded accent-[#0071e3]" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-[#1d1d1f] truncate">{{ doc.original_name }}</p>
              <p class="text-xs text-[#6e6e73]">{{ doc.chunk_count }} chunks</p>
            </div>
          </label>
        </div>
      </div>

      <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p class="text-sm text-red-600">{{ error }}</p>
      </div>

      <div class="flex gap-3">
        <button type="submit" :disabled="creating"
          class="flex-1 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2.5 shadow-[0_1px_3px_rgba(0,113,227,0.4)] transition-colors">
          {{ creating ? 'Creating…' : 'Create Room' }}
        </button>
        <router-link to="/rooms"
          class="px-6 py-2.5 rounded-lg bg-[#f5f5f7] hover:bg-gray-200 text-[#1d1d1f] text-sm font-medium transition-colors text-center">
          Cancel
        </router-link>
      </div>
    </form>
  </div>
</template>
