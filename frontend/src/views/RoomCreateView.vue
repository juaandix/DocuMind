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
    <div class="flex items-center gap-3 mb-8">
      <router-link to="/rooms" class="text-black dark:text-white hover:text-yellow-600 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <h1 class="text-3xl font-black uppercase tracking-tight text-black dark:text-white">New Chat Room</h1>
    </div>

    <form @submit.prevent="submit" class="space-y-5">
      <div class="relative">
        <div class="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-black dark:bg-yellow-400"></div>
        <div class="relative bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-5">
          <label class="block text-[10px] font-black uppercase tracking-widest text-black/50 dark:text-white/50 mb-2">Room Name</label>
          <input v-model="name" type="text" placeholder="e.g. Q4 Financial Report Analysis" required
            class="w-full border-2 border-black dark:border-white bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:shadow-[4px_4px_0_0_#000] dark:focus:shadow-[4px_4px_0_0_#fff] focus:-translate-x-0.5 focus:-translate-y-0.5"
          />
        </div>
      </div>

      <div class="relative">
        <div class="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-black dark:bg-yellow-400"></div>
        <div class="relative bg-white dark:bg-neutral-900 border-2 border-black dark:border-white p-5">
          <div class="flex items-center justify-between mb-4">
            <label class="text-[10px] font-black uppercase tracking-widest text-black/50 dark:text-white/50">Attach Documents</label>
            <span v-if="selectedIds.length > 0" class="text-[10px] font-black uppercase bg-yellow-400 text-black border border-black px-2 py-0.5">{{ selectedIds.length }} selected</span>
          </div>

          <div v-if="readyDocs.length === 0" class="text-center py-6 border-2 border-dashed border-black/20 dark:border-white/20">
            <p class="text-sm font-black uppercase text-black/30 dark:text-white/30">No ready documents</p>
            <router-link to="/documents/upload" class="text-xs font-black uppercase text-yellow-600 hover:underline mt-1 block">Upload first →</router-link>
          </div>

          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <label v-for="doc in readyDocs" :key="doc.id"
              :class="[
                'flex items-center gap-3 p-3 border-2 cursor-pointer transition-none',
                selectedIds.includes(doc.id)
                  ? 'border-black dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#facc15]'
                  : 'border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white hover:bg-yellow-50 dark:hover:bg-neutral-800'
              ]"
            >
              <input type="checkbox" :checked="selectedIds.includes(doc.id)" @change="toggleDoc(doc.id)"
                class="w-4 h-4 border-2 border-black dark:border-white accent-yellow-400" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-black dark:text-white truncate">{{ doc.original_name }}</p>
                <p class="text-xs font-medium text-black/40 dark:text-white/40">{{ doc.chunk_count }} chunks</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div v-if="error" class="border-2 border-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3">
        <p class="text-sm font-bold text-red-700 dark:text-red-400">{{ error }}</p>
      </div>

      <div class="flex gap-3">
        <button type="submit" :disabled="creating"
          class="flex-1 bg-yellow-400 text-black font-black text-xs uppercase tracking-widest py-3 border-2 border-black shadow-[4px_4px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50">
          {{ creating ? 'Creating...' : 'Create Room →' }}
        </button>
        <router-link to="/rooms"
          class="px-6 py-3 border-2 border-black dark:border-white text-xs font-black uppercase tracking-widest text-black dark:text-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none bg-white dark:bg-neutral-900 text-center">
          Cancel
        </router-link>
      </div>
    </form>
  </div>
</template>
