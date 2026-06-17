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
  await Promise.all([docsStore.fetchDocuments(), roomsStore.fetchRooms(), wsStore.fetchWorkspace()])
})

const readyDocs = computed(() => docsStore.documents.filter(d => d.status === 'READY'))
const processingDocs = computed(() => docsStore.documents.filter(d => d.status === 'PROCESSING'))
const storagePercent = computed(() => {
  const ws = wsStore.workspace
  if (!ws?.storage_limit_bytes) return 0
  return Math.min(100, Math.round((ws.storage_used_bytes / ws.storage_limit_bytes) * 100))
})

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})
const firstName = computed(() => auth.user?.full_name?.split(' ')[0] ?? '')
const isNewUser = computed(() => docsStore.documents.length === 0 && roomsStore.rooms.length === 0)
</script>

<template>
  <div class="p-8 max-w-5xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-[#1d1d1f]">
        {{ greeting }}, {{ firstName }}
      </h1>
      <p class="text-sm text-[#6e6e73] mt-1">Here's what's happening in your workspace.</p>
    </div>

    <!-- Quick actions -->
    <div class="flex flex-wrap gap-3 mb-8">
      <router-link to="/documents/upload"
        class="inline-flex items-center gap-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium rounded-xl px-4 py-2.5 shadow-[0_1px_3px_rgba(0,113,227,0.4)] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
        </svg>
        Upload document
      </router-link>
      <router-link to="/rooms/new"
        class="inline-flex items-center gap-2 bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] text-sm font-medium rounded-xl px-4 py-2.5 border border-black/[0.1] shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        New chat room
      </router-link>
      <router-link to="/settings/members"
        class="inline-flex items-center gap-2 bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] text-sm font-medium rounded-xl px-4 py-2.5 border border-black/[0.1] shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        Invite member
      </router-link>
    </div>

    <!-- Onboarding (new users only) -->
    <div v-if="isNewUser" class="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6 mb-8">
      <h2 class="text-base font-semibold text-[#1d1d1f] mb-1">Get started with DocuMind</h2>
      <p class="text-sm text-[#6e6e73] mb-5">Three steps to start chatting with your documents.</p>
      <div class="grid sm:grid-cols-3 gap-4">
        <router-link to="/documents/upload"
          class="group flex flex-col gap-3 p-4 rounded-xl border-2 border-dashed border-[#0071e3]/30 hover:border-[#0071e3] hover:bg-[#0071e3]/[0.02] transition-all">
          <div class="w-9 h-9 rounded-xl bg-[#0071e3]/[0.1] flex items-center justify-center">
            <span class="text-sm font-bold text-[#0071e3]">1</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-[#1d1d1f]">Upload a document</p>
            <p class="text-xs text-[#6e6e73] mt-0.5">PDF, DOCX or TXT — up to 50 MB</p>
          </div>
          <span class="text-xs font-medium text-[#0071e3] group-hover:underline">Upload →</span>
        </router-link>
        <router-link to="/rooms/new"
          class="group flex flex-col gap-3 p-4 rounded-xl border-2 border-dashed border-black/[0.1] hover:border-[#34c759] hover:bg-[#34c759]/[0.02] transition-all">
          <div class="w-9 h-9 rounded-xl bg-[#34c759]/[0.1] flex items-center justify-center">
            <span class="text-sm font-bold text-[#34c759]">2</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-[#1d1d1f]">Create a chat room</p>
            <p class="text-xs text-[#6e6e73] mt-0.5">Attach documents and start a conversation</p>
          </div>
          <span class="text-xs font-medium text-[#34c759] group-hover:underline">Create room →</span>
        </router-link>
        <router-link to="/settings/members"
          class="group flex flex-col gap-3 p-4 rounded-xl border-2 border-dashed border-black/[0.1] hover:border-[#af52de] hover:bg-[#af52de]/[0.02] transition-all">
          <div class="w-9 h-9 rounded-xl bg-[#af52de]/[0.1] flex items-center justify-center">
            <span class="text-sm font-bold text-[#af52de]">3</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-[#1d1d1f]">Invite your team</p>
            <p class="text-xs text-[#6e6e73] mt-0.5">Collaborate with colleagues in real time</p>
          </div>
          <span class="text-xs font-medium text-[#af52de] group-hover:underline">Invite members →</span>
        </router-link>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div class="w-9 h-9 rounded-xl bg-[#0071e3]/[0.1] flex items-center justify-center mb-3">
          <svg class="w-5 h-5 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
        </div>
        <p class="text-2xl font-semibold text-[#1d1d1f]">{{ docsStore.documents.length }}</p>
        <p class="text-xs text-[#6e6e73] mt-0.5">Documents</p>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div class="w-9 h-9 rounded-xl bg-[#34c759]/[0.12] flex items-center justify-center mb-3">
          <svg class="w-5 h-5 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <p class="text-2xl font-semibold text-[#1d1d1f]">{{ roomsStore.rooms.length }}</p>
        <p class="text-xs text-[#6e6e73] mt-0.5">Chat Rooms</p>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div class="w-9 h-9 rounded-xl bg-[#ff9f0a]/[0.12] flex items-center justify-center mb-3">
          <svg class="w-5 h-5 text-[#ff9f0a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </div>
        <p class="text-2xl font-semibold text-[#1d1d1f]">{{ processingDocs.length }}</p>
        <p class="text-xs text-[#6e6e73] mt-0.5">Processing</p>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div class="w-9 h-9 rounded-xl bg-[#af52de]/[0.12] flex items-center justify-center mb-3">
          <svg class="w-5 h-5 text-[#af52de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M10 12h4"/>
          </svg>
        </div>
        <div>
          <p class="text-2xl font-semibold text-[#1d1d1f]">{{ storagePercent }}%</p>
          <p class="text-xs text-[#6e6e73] mt-0.5">Storage used</p>
          <div class="mt-2 h-1 rounded-full bg-black/[0.06] overflow-hidden">
            <div class="h-full rounded-full bg-[#af52de] transition-all" :style="{ width: storagePercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content grid -->
    <div class="grid lg:grid-cols-5 gap-6">
      <!-- Recent documents -->
      <div class="lg:col-span-3 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
          <h2 class="text-sm font-semibold text-[#1d1d1f]">Recent Documents</h2>
          <router-link to="/documents" class="text-xs text-[#0071e3] hover:underline font-medium">View all</router-link>
        </div>

        <div v-if="docsStore.documents.length === 0" class="flex flex-col items-center justify-center py-14 text-center">
          <div class="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-[#6e6e73]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
          </div>
          <p class="text-sm font-medium text-[#1d1d1f]">No documents yet</p>
          <router-link to="/documents/upload" class="text-xs text-[#0071e3] hover:underline mt-1.5">Upload your first document</router-link>
        </div>

        <div v-else class="divide-y divide-black/[0.04]">
          <div v-for="doc in docsStore.documents.slice(0, 6)" :key="doc.id"
            class="flex items-center gap-3 px-5 py-3 hover:bg-[#f5f5f7] transition-colors">
            <div class="w-8 h-8 rounded-lg bg-[#0071e3]/[0.08] flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <router-link :to="`/documents/${doc.id}`" class="text-sm font-medium text-[#1d1d1f] truncate block hover:text-[#0071e3] transition-colors">
                {{ doc.original_name }}
              </router-link>
              <p class="text-xs text-[#6e6e73]">{{ formatSize(doc.size_bytes) }} · {{ formatDate(doc.created_at) }}</p>
            </div>
            <span :class="[
              'text-[10px] font-medium px-2 py-0.5 rounded-full',
              doc.status === 'READY' ? 'bg-[#34c759]/[0.12] text-[#248a3d]' :
              doc.status === 'PROCESSING' ? 'bg-[#ff9f0a]/[0.12] text-[#b86d00]' :
              doc.status === 'ERROR' ? 'bg-red-50 text-red-600' :
              'bg-[#0071e3]/[0.08] text-[#0071e3]'
            ]">{{ doc.status }}</span>
          </div>
        </div>
      </div>

      <!-- Recent rooms -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
          <h2 class="text-sm font-semibold text-[#1d1d1f]">Chat Rooms</h2>
          <router-link to="/rooms" class="text-xs text-[#0071e3] hover:underline font-medium">View all</router-link>
        </div>

        <div v-if="roomsStore.rooms.length === 0" class="flex flex-col items-center justify-center py-14 text-center">
          <div class="w-12 h-12 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-[#6e6e73]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <p class="text-sm font-medium text-[#1d1d1f]">No rooms yet</p>
          <router-link to="/rooms/new" class="text-xs text-[#0071e3] hover:underline mt-1.5">Create a room</router-link>
        </div>

        <div v-else class="divide-y divide-black/[0.04]">
          <router-link v-for="room in roomsStore.rooms.slice(0, 6)" :key="room.id" :to="`/rooms/${room.id}`"
            class="flex items-center gap-3 px-5 py-3 hover:bg-[#f5f5f7] transition-colors block">
            <div class="w-8 h-8 rounded-lg bg-[#34c759]/[0.1] flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-[#1d1d1f] truncate">{{ room.name }}</p>
              <p class="text-xs text-[#6e6e73]">{{ room.document_ids.length }} docs · {{ formatDate(room.created_at) }}</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
