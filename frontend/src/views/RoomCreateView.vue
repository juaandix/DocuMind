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
  error.value = ''
  creating.value = true
  try {
    const room = await roomsStore.createRoom(name.value.trim(), selectedIds.value)
    router.push(`/rooms/${room.id}`)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to create room'
  } finally { creating.value = false }
}
</script>

<template>
  <div class="p-8 max-w-2xl">
    <div class="flex items-center gap-3 mb-8">
      <router-link to="/rooms" class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">New Chat Room</h1>
    </div>

    <form @submit.prevent="submit" class="space-y-5">
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Room name</label>
        <input
          v-model="name"
          type="text"
          placeholder="e.g. Q4 Financial Report Analysis"
          required
          class="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors"
        />
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div class="flex items-center justify-between mb-4">
          <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Attach documents</label>
          <span v-if="selectedIds.length > 0" class="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-full">
            {{ selectedIds.length }} selected
          </span>
        </div>

        <div v-if="readyDocs.length === 0" class="text-center py-8">
          <p class="text-sm text-slate-400 dark:text-slate-500">No ready documents.</p>
          <router-link to="/documents/upload" class="text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium">Upload one first →</router-link>
        </div>

        <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1">
          <label
            v-for="doc in readyDocs"
            :key="doc.id"
            :class="[
              'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
              selectedIds.includes(doc.id)
                ? 'border-violet-300 dark:border-violet-500/40 bg-violet-50 dark:bg-violet-500/10'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            ]"
          >
            <input
              type="checkbox"
              :checked="selectedIds.includes(doc.id)"
              @change="toggleDoc(doc.id)"
              class="w-4 h-4 text-violet-600 rounded border-slate-300 dark:border-slate-600 focus:ring-violet-500"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{{ doc.original_name }}</p>
              <p class="text-xs text-slate-400 dark:text-slate-500">{{ doc.chunk_count }} chunks</p>
            </div>
          </label>
        </div>
      </div>

      <div v-if="error" class="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl px-4 py-3">
        <svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="creating"
          class="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-2.5 rounded-xl shadow-lg shadow-violet-500/20 disabled:opacity-50 transition-all"
        >
          {{ creating ? 'Creating…' : 'Create room' }}
        </button>
        <router-link
          to="/rooms"
          class="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
        >
          Cancel
        </router-link>
      </div>
    </form>
  </div>
</template>
