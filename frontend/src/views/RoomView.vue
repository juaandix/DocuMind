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

onMounted(async () => {
  await Promise.all([
    roomsStore.fetchRooms(),
    docsStore.fetchDocuments(),
    roomsStore.fetchMessages(roomId.value),
  ])
  const found = roomsStore.rooms.find(r => r.id === roomId.value)
  if (found) roomsStore.activeRoom = found
  roomsStore.connectWebSocket(roomId.value)
  await nextTick()
  scrollToBottom()
})

onUnmounted(() => {
  roomsStore.disconnect()
  roomsStore.activeRoom = null
})

watch(() => roomsStore.messages.length, async () => {
  await nextTick(); scrollToBottom()
})
watch(() => roomsStore.aiStreamBuffer, async () => {
  await nextTick(); scrollToBottom()
})

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
function docName(id: string) { return docsStore.documents.find(d => d.id === id)?.original_name ?? id }
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

function renderContent(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono text-violet-700 dark:text-violet-400">$1</code>')
    .replace(/\n/g, '<br/>')
}
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-slate-950">
    <!-- Header -->
    <div class="flex-shrink-0 flex items-center justify-between px-6 h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div class="flex items-center gap-3 min-w-0">
        <router-link to="/rooms" class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex-shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </router-link>
        <h1 class="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{{ room?.name ?? 'Chat' }}</h1>
        <div v-if="roomsStore.connectedUsers.length > 0" class="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {{ roomsStore.connectedUsers.length }} online
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span v-if="exportTaskId" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">Export queued ✓</span>
        <button
          v-else
          @click="handleExport"
          :disabled="exporting"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Export PDF
        </button>
        <button
          @click="showInfo = !showInfo"
          :class="['p-1.5 rounded-lg transition-colors', showInfo ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800']"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Messages area -->
      <div class="flex-1 flex flex-col min-w-0">
        <div ref="messagesEl" class="flex-1 overflow-y-auto">
          <!-- Empty state -->
          <div v-if="roomsStore.messages.length === 0 && !roomsStore.isAiTyping" class="flex flex-col items-center justify-center h-full text-center py-16 px-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
              <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <p class="text-slate-700 dark:text-slate-300 font-semibold text-lg">Ask anything</p>
            <p class="text-slate-400 dark:text-slate-500 text-sm mt-1.5 max-w-xs">Powered by {{ roomDocs.length }} document{{ roomDocs.length !== 1 ? 's' : '' }}. Ask a question and I'll find the answer.</p>
          </div>

          <!-- Message list -->
          <div class="max-w-3xl mx-auto px-6 py-6 space-y-6">
            <template v-for="msg in roomsStore.messages" :key="msg.id">
              <!-- User message -->
              <div v-if="msg.role === 'user'" class="flex justify-end">
                <div class="max-w-[85%] space-y-1">
                  <div
                    class="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-br-sm text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
                    v-html="renderContent(msg.content)"
                  ></div>
                  <p v-if="!isOwnMessage(msg)" class="text-[11px] text-slate-400 text-right pr-1">
                    {{ roomsStore.connectedUsers.find(u => u.id === msg.author_id)?.name ?? 'User' }}
                  </p>
                </div>
              </div>

              <!-- AI message -->
              <div v-else-if="msg.role === 'assistant'" class="flex gap-4">
                <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-violet-500/20">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0 pt-0.5">
                  <div
                    class="text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
                    v-html="renderContent(msg.content)"
                  ></div>

                  <!-- Sources -->
                  <div v-if="msg.sources?.length > 0" class="mt-3">
                    <button
                      @click="toggleSources(msg.id)"
                      class="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      {{ msg.sources.length }} source{{ msg.sources.length > 1 ? 's' : '' }}
                      <svg :class="['w-3 h-3 transition-transform', expandedSources.has(msg.id) ? 'rotate-180' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>

                    <div v-if="expandedSources.has(msg.id)" class="mt-2 space-y-2">
                      <div
                        v-for="(src, i) in (msg.sources as MessageSource[])"
                        :key="i"
                        class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl p-3 text-xs"
                      >
                        <div class="flex items-center justify-between mb-1.5">
                          <span class="font-semibold text-slate-700 dark:text-slate-300 truncate">{{ src.document_name }}</span>
                          <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span v-if="src.page" class="text-slate-400">p.{{ src.page }}</span>
                            <span class="bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400 px-1.5 py-0.5 rounded-md font-semibold">
                              {{ formatScore(src.score) }}
                            </span>
                          </div>
                        </div>
                        <p class="text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{{ src.chunk_content }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- AI streaming / typing -->
            <div v-if="roomsStore.isAiTyping" class="flex gap-4">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-violet-500/20">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0 pt-1.5">
                <div v-if="roomsStore.aiStreamBuffer" class="text-sm text-slate-800 dark:text-slate-200 leading-relaxed" v-html="renderContent(roomsStore.aiStreamBuffer)">
                </div>
                <div v-if="roomsStore.aiStreamBuffer" class="inline-block w-0.5 h-4 bg-violet-500 ml-0.5 animate-pulse align-text-bottom"></div>
                <span v-else class="flex items-center gap-1.5 py-1">
                  <span class="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style="animation-delay:0ms"></span>
                  <span class="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style="animation-delay:150ms"></span>
                  <span class="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style="animation-delay:300ms"></span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input area -->
        <div class="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4">
          <div class="max-w-3xl mx-auto">
            <div class="flex items-end gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-violet-500/50 focus-within:border-violet-500/50 transition-all">
              <textarea
                v-model="inputText"
                @keydown="onKeydown"
                :disabled="roomsStore.isAiTyping"
                placeholder="Ask anything about your documents…"
                rows="1"
                class="flex-1 resize-none bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none min-h-[1.5rem] max-h-32 overflow-y-auto disabled:opacity-50"
                style="field-sizing: content;"
              ></textarea>
              <button
                @click="sendMessage"
                :disabled="!inputText.trim() || roomsStore.isAiTyping"
                class="flex-shrink-0 p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-violet-500/20 hover:shadow-violet-500/30"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
                </svg>
              </button>
            </div>
            <p class="text-[11px] text-slate-400 dark:text-slate-600 mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>

      <!-- Info sidebar -->
      <div
        v-if="showInfo"
        class="flex-shrink-0 w-60 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-y-auto"
      >
        <div class="p-4 space-y-5">
          <div>
            <h3 class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Online</h3>
            <div v-if="roomsStore.connectedUsers.length === 0" class="text-xs text-slate-400 dark:text-slate-500">Just you</div>
            <div v-for="user in roomsStore.connectedUsers" :key="user.id" class="flex items-center gap-2 py-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
              <span class="text-xs text-slate-700 dark:text-slate-300 truncate">{{ user.name }}</span>
            </div>
          </div>

          <div>
            <h3 class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Documents</h3>
            <div v-if="roomDocs.length === 0" class="text-xs text-slate-400 dark:text-slate-500">No documents attached</div>
            <div v-for="doc in roomDocs" :key="doc!.id" class="flex items-start gap-2 py-1.5">
              <div class="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{{ doc!.original_name }}</p>
                <p class="text-[11px] text-slate-400 dark:text-slate-500">{{ doc!.chunk_count ?? '—' }} chunks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
