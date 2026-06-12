<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRoomsStore } from '@/stores/rooms.store'
import { useDocumentsStore } from '@/stores/documents.store'
import { useAuthStore } from '@/stores/auth.store'
import type { Message, MessageSource } from '@/types/room'

const route = useRoute()
const roomsStore = useRoomsStore()
const docsStore = useDocumentsStore()
const authStore = useAuthStore()

const roomId = computed(() => route.params.id as string)
const inputText = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const showInfo = ref(false)
const expandedSources = ref<Set<string>>(new Set())
const exporting = ref(false)
const exportTaskId = ref<string | null>(null)
const typingTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

// Document management in sidebar
const editingDocs = ref(false)
const pendingDocIds = ref<string[]>([])
const savingDocs = ref(false)

onMounted(async () => {
  await Promise.all([roomsStore.fetchRooms(), docsStore.fetchDocuments(), roomsStore.fetchMessages(roomId.value)])
  const found = roomsStore.rooms.find(r => r.id === roomId.value)
  if (found) roomsStore.activeRoom = found
  roomsStore.connectWebSocket(roomId.value)
  await nextTick()
  scrollToBottom()
})

onUnmounted(() => { roomsStore.disconnect(); roomsStore.activeRoom = null })

watch(() => roomsStore.messages.length, async () => { await nextTick(); scrollToBottom() })
watch(() => roomsStore.aiStreamBuffer, async () => { await nextTick(); scrollToBottom() })

function scrollToBottom() {
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

function sendMessage() {
  const text = inputText.value.trim()
  if (!text || roomsStore.isAiTyping) return
  roomsStore.sendMessage(text)
  inputText.value = ''
  if (typingTimeout.value) { clearTimeout(typingTimeout.value); roomsStore.sendTypingStop() }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); return }
  if (typingTimeout.value) clearTimeout(typingTimeout.value)
  roomsStore.sendTypingStart()
  typingTimeout.value = setTimeout(() => { roomsStore.sendTypingStop(); typingTimeout.value = null }, 2000)
}

function toggleSources(msgId: string) {
  if (expandedSources.value.has(msgId)) expandedSources.value.delete(msgId)
  else expandedSources.value.add(msgId)
  expandedSources.value = new Set(expandedSources.value)
}

function isOwnMessage(msg: Message) { return msg.author_id === authStore.user?.id }
function formatScore(score: number) { return `${Math.round(score * 100)}%` }

async function handleExport() {
  exporting.value = true
  try {
    const { roomsService } = await import('@/services/rooms.service')
    const { task_id } = await roomsService.exportPdf(roomId.value)
    exportTaskId.value = task_id
  } finally { exporting.value = false }
}

const room = computed(() => roomsStore.activeRoom)
const roomDocs = computed(() =>
  (room.value?.document_ids ?? []).map(id => docsStore.documents.find(d => d.id === id)).filter(Boolean)
)
const readyDocs = computed(() => docsStore.documents.filter(d => d.status === 'READY'))

function startEditDocs() {
  pendingDocIds.value = [...(room.value?.document_ids ?? [])]
  editingDocs.value = true
}

function cancelEditDocs() { editingDocs.value = false }

function togglePendingDoc(id: string) {
  if (pendingDocIds.value.includes(id)) pendingDocIds.value = pendingDocIds.value.filter(i => i !== id)
  else pendingDocIds.value = [...pendingDocIds.value, id]
}

async function saveDocChanges() {
  savingDocs.value = true
  try {
    const { roomsService } = await import('@/services/rooms.service')
    const updated = await roomsService.update(roomId.value, { document_ids: pendingDocIds.value })
    roomsStore.activeRoom = updated
    const idx = roomsStore.rooms.findIndex(r => r.id === roomId.value)
    if (idx >= 0) roomsStore.rooms[idx] = updated
    editingDocs.value = false
  } finally { savingDocs.value = false }
}

function renderContent(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,113,227,0.08);color:#0071e3;padding:2px 5px;border-radius:4px;font-family:ui-monospace,monospace;font-size:0.85em">$1</code>')
    .replace(/\n/g, '<br/>')
}
</script>

<template>
  <div class="flex flex-col h-full bg-[#f5f5f7]">
    <!-- Header -->
    <div class="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
      <div class="flex items-center gap-3 min-w-0">
        <router-link to="/rooms" class="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors flex-shrink-0">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </router-link>
        <h1 class="text-sm font-semibold text-[#1d1d1f] truncate">{{ room?.name ?? 'Chat' }}</h1>
        <div v-if="roomsStore.connectedUsers.length > 0" class="flex items-center gap-1.5 flex-shrink-0">
          <div class="w-1.5 h-1.5 rounded-full bg-[#34c759]"></div>
          <span class="text-xs text-[#6e6e73]">{{ roomsStore.connectedUsers.length }} online</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span v-if="exportTaskId" class="text-xs font-medium text-[#34c759] bg-[#34c759]/[0.1] px-2.5 py-1 rounded-full">Export queued ✓</span>
        <button v-else @click="handleExport" :disabled="exporting"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Export PDF
        </button>
        <button @click="showInfo = !showInfo"
          :class="['p-1.5 rounded-lg transition-colors', showInfo ? 'bg-[#0071e3]/[0.1] text-[#0071e3]' : 'text-[#6e6e73] hover:bg-black/[0.04]']">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Messages -->
      <div class="flex-1 flex flex-col min-w-0">
        <div ref="messagesEl" class="flex-1 overflow-y-auto">
          <!-- Empty state -->
          <div v-if="roomsStore.messages.length === 0 && !roomsStore.isAiTyping" class="flex flex-col items-center justify-center h-full text-center py-16 px-4">
            <div class="w-14 h-14 rounded-2xl bg-[#0071e3]/[0.08] flex items-center justify-center mb-4">
              <svg class="w-7 h-7 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <p class="text-base font-semibold text-[#1d1d1f]">Ask anything</p>
            <p class="text-sm text-[#6e6e73] mt-1">{{ roomDocs.length }} document{{ roomDocs.length !== 1 ? 's' : '' }} ready to answer your questions.</p>
          </div>

          <!-- Message list -->
          <div class="max-w-3xl mx-auto px-6 py-6 space-y-6">
            <template v-for="msg in roomsStore.messages" :key="msg.id">
              <!-- User message -->
              <div v-if="msg.role === 'user'" class="flex justify-end">
                <div class="max-w-[78%]">
                  <div class="bg-[#0071e3] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed" v-html="renderContent(msg.content)"></div>
                  <p v-if="!isOwnMessage(msg)" class="text-[10px] text-[#6e6e73] text-right mt-1 px-1">
                    {{ roomsStore.connectedUsers.find(u => u.id === msg.author_id)?.name ?? 'User' }}
                  </p>
                </div>
              </div>

              <!-- AI message -->
              <div v-else-if="msg.role === 'assistant'" class="flex gap-3">
                <div class="w-8 h-8 rounded-xl bg-[#0071e3] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_2px_8px_rgba(0,113,227,0.35)]">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0 pt-1">
                  <div class="text-sm text-[#1d1d1f] leading-relaxed" v-html="renderContent(msg.content)"></div>

                  <!-- Sources -->
                  <div v-if="msg.sources?.length > 0" class="mt-3">
                    <button @click="toggleSources(msg.id)"
                      class="flex items-center gap-1.5 text-xs font-medium text-[#0071e3] hover:underline">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      {{ msg.sources.length }} source{{ msg.sources.length > 1 ? 's' : '' }}
                      <svg :class="['w-3 h-3 transition-transform', expandedSources.has(msg.id) ? 'rotate-180' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>

                    <div v-if="expandedSources.has(msg.id)" class="mt-2 space-y-2">
                      <div v-for="(src, i) in (msg.sources as MessageSource[])" :key="i"
                        class="bg-white rounded-xl border border-black/[0.06] p-3 text-xs shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                        <div class="flex items-center justify-between mb-1.5">
                          <span class="font-medium text-[#1d1d1f] truncate text-xs">{{ src.document_name }}</span>
                          <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span v-if="src.page" class="text-[#6e6e73]">p.{{ src.page }}</span>
                            <span class="bg-[#0071e3]/[0.08] text-[#0071e3] px-1.5 py-0.5 rounded-full text-[10px] font-medium">{{ formatScore(src.score) }}</span>
                          </div>
                        </div>
                        <p class="text-[#6e6e73] leading-relaxed line-clamp-3">{{ src.chunk_content }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- AI typing -->
            <div v-if="roomsStore.isAiTyping" class="flex gap-3">
              <div class="w-8 h-8 rounded-xl bg-[#0071e3] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_2px_8px_rgba(0,113,227,0.35)]">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0 pt-1.5">
                <span v-if="roomsStore.aiStreamBuffer" class="text-sm text-[#1d1d1f] leading-relaxed" v-html="renderContent(roomsStore.aiStreamBuffer)"></span>
                <span v-if="roomsStore.aiStreamBuffer" class="inline-block w-0.5 h-4 bg-[#0071e3] ml-0.5 animate-pulse align-text-bottom"></span>
                <span v-else class="flex items-center gap-1.5 py-1">
                  <span class="w-2 h-2 rounded-full bg-[#6e6e73] animate-bounce" style="animation-delay:0ms"></span>
                  <span class="w-2 h-2 rounded-full bg-[#6e6e73] animate-bounce" style="animation-delay:150ms"></span>
                  <span class="w-2 h-2 rounded-full bg-[#6e6e73] animate-bounce" style="animation-delay:300ms"></span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="flex-shrink-0 border-t border-black/[0.06] bg-white/80 backdrop-blur-xl px-4 py-4">
          <div class="max-w-3xl mx-auto">
            <div class="flex items-end gap-3 bg-white border border-black/[0.1] rounded-2xl px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-[#0071e3]/30 focus-within:border-[#0071e3] transition-all">
              <textarea v-model="inputText" @keydown="onKeydown" :disabled="roomsStore.isAiTyping"
                placeholder="Ask anything about your documents…"
                rows="1"
                class="flex-1 resize-none bg-transparent text-sm text-[#1d1d1f] placeholder-[#6e6e73] focus:outline-none min-h-[1.5rem] max-h-32 overflow-y-auto disabled:opacity-50"
                style="field-sizing: content;"
              ></textarea>
              <button @click="sendMessage" :disabled="!inputText.trim() || roomsStore.isAiTyping"
                class="flex-shrink-0 p-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors shadow-[0_1px_3px_rgba(0,113,227,0.4)]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
                </svg>
              </button>
            </div>
            <p class="text-[10px] text-[#6e6e73] mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>

      <!-- Info sidebar -->
      <div v-if="showInfo" class="flex-shrink-0 w-56 border-l border-black/[0.06] bg-white/80 backdrop-blur-xl overflow-y-auto">
        <div class="p-4 space-y-5">
          <div>
            <h3 class="text-[10px] font-semibold uppercase tracking-widest text-[#6e6e73] mb-2">Online</h3>
            <div v-if="roomsStore.connectedUsers.length === 0" class="text-xs text-[#6e6e73]">Just you</div>
            <div v-for="user in roomsStore.connectedUsers" :key="user.id" class="flex items-center gap-2 py-1">
              <div class="w-1.5 h-1.5 rounded-full bg-[#34c759] flex-shrink-0"></div>
              <span class="text-xs font-medium text-[#1d1d1f] truncate">{{ user.name }}</span>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-[10px] font-semibold uppercase tracking-widest text-[#6e6e73]">Documents</h3>
              <button v-if="!editingDocs" @click="startEditDocs"
                class="text-[10px] font-medium text-[#0071e3] hover:underline">Edit</button>
              <div v-else class="flex gap-2">
                <button @click="cancelEditDocs" class="text-[10px] text-[#6e6e73] hover:text-[#1d1d1f]">Cancel</button>
                <button @click="saveDocChanges" :disabled="savingDocs"
                  class="text-[10px] font-semibold text-[#0071e3] disabled:opacity-50">
                  {{ savingDocs ? '…' : 'Save' }}
                </button>
              </div>
            </div>

            <!-- View mode -->
            <template v-if="!editingDocs">
              <div v-if="roomDocs.length === 0" class="text-xs text-[#6e6e73]">None attached</div>
              <div v-for="doc in roomDocs" :key="doc!.id" class="flex items-start gap-2 py-1.5">
                <div class="w-6 h-6 rounded-lg bg-[#0071e3]/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg class="w-3 h-3 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-medium text-[#1d1d1f] truncate">{{ doc!.original_name }}</p>
                  <p class="text-[10px] text-[#6e6e73]">{{ doc!.chunk_count ?? '—' }} chunks</p>
                </div>
              </div>
            </template>

            <!-- Edit mode -->
            <template v-else>
              <div v-if="readyDocs.length === 0" class="text-xs text-[#6e6e73] py-2">No ready documents</div>
              <label v-for="doc in readyDocs" :key="doc.id"
                :class="['flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors', pendingDocIds.includes(doc.id) ? 'bg-[#0071e3]/[0.08]' : 'hover:bg-[#f5f5f7]']">
                <input type="checkbox" :checked="pendingDocIds.includes(doc.id)" @change="togglePendingDoc(doc.id)"
                  class="w-3.5 h-3.5 rounded accent-[#0071e3] flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-xs font-medium text-[#1d1d1f] truncate">{{ doc.original_name }}</p>
                  <p class="text-[10px] text-[#6e6e73]">{{ doc.chunk_count ?? '—' }} chunks</p>
                </div>
              </label>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
