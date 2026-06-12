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
  await nextTick()
  scrollToBottom()
})

watch(() => roomsStore.aiStreamBuffer, async () => {
  await nextTick()
  scrollToBottom()
})

function scrollToBottom() {
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

function sendMessage() {
  const text = inputText.value.trim()
  if (!text || roomsStore.isAiTyping) return
  roomsStore.sendMessage(text)
  inputText.value = ''
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
    roomsStore.sendTypingStop()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
    return
  }
  // typing indicator
  if (typingTimeout.value) clearTimeout(typingTimeout.value)
  roomsStore.sendTypingStart()
  typingTimeout.value = setTimeout(() => {
    roomsStore.sendTypingStop()
    typingTimeout.value = null
  }, 2000)
}

function toggleSources(msgId: string) {
  if (expandedSources.value.has(msgId)) {
    expandedSources.value.delete(msgId)
  } else {
    expandedSources.value.add(msgId)
  }
  // trigger reactivity
  expandedSources.value = new Set(expandedSources.value)
}

function isOwnMessage(msg: Message) {
  return msg.author_id === authStore.user?.id
}

function docName(id: string) {
  return docsStore.documents.find(d => d.id === id)?.original_name ?? id
}

function formatScore(score: number) {
  return `${Math.round(score * 100)}%`
}

async function handleExport() {
  exporting.value = true
  try {
    const { roomsService } = await import('@/services/rooms.service')
    const { task_id } = await roomsService.exportPdf(roomId.value)
    exportTaskId.value = task_id
  } finally {
    exporting.value = false
  }
}

const room = computed(() => roomsStore.activeRoom)
const roomDocs = computed(() =>
  (room.value?.document_ids ?? []).map(id => docsStore.documents.find(d => d.id === id)).filter(Boolean)
)

// Markdown-like rendering: bold, code, line breaks
function renderContent(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\n/g, '<br/>')
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex-shrink-0 flex items-center justify-between px-6 h-16 border-b border-gray-200 bg-white">
      <div class="flex items-center gap-3 min-w-0">
        <router-link to="/rooms" class="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </router-link>
        <h1 class="font-semibold text-gray-900 truncate">{{ room?.name ?? 'Chat' }}</h1>
        <div v-if="roomsStore.connectedUsers.length > 0" class="flex items-center gap-1.5 text-xs text-gray-400">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          {{ roomsStore.connectedUsers.length }} online
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Export PDF -->
        <div v-if="exportTaskId" class="text-xs text-green-600 font-medium">Export queued ✓</div>
        <button
          v-else
          @click="handleExport"
          :disabled="exporting"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          title="Export as PDF"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Export
        </button>
        <!-- Info toggle -->
        <button
          @click="showInfo = !showInfo"
          :class="['p-2 rounded-lg transition-colors', showInfo ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100']"
          title="Room info"
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
        <div ref="messagesEl" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <!-- Empty state -->
          <div v-if="roomsStore.messages.length === 0 && !roomsStore.isAiTyping" class="flex flex-col items-center justify-center h-full text-center py-16">
            <svg class="w-12 h-12 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <p class="text-gray-400 font-medium">No messages yet</p>
            <p class="text-gray-300 text-sm mt-1">Ask anything about the attached documents</p>
          </div>

          <!-- Message bubbles -->
          <template v-for="msg in roomsStore.messages" :key="msg.id">
            <!-- User message -->
            <div v-if="msg.role === 'user'" class="flex justify-end">
              <div class="max-w-[75%]">
                <div class="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
                  v-html="renderContent(msg.content)">
                </div>
                <p v-if="!isOwnMessage(msg)" class="text-xs text-gray-400 text-right mt-1">
                  {{ roomsStore.connectedUsers.find(u => u.id === msg.author_id)?.name ?? 'User' }}
                </p>
              </div>
            </div>

            <!-- AI message -->
            <div v-else-if="msg.role === 'assistant'" class="flex items-start gap-3">
              <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-800 leading-relaxed shadow-sm"
                  v-html="renderContent(msg.content)">
                </div>

                <!-- Sources -->
                <div v-if="msg.sources?.length > 0" class="mt-1.5">
                  <button
                    @click="toggleSources(msg.id)"
                    class="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
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
                      class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs"
                    >
                      <div class="flex items-center justify-between mb-1.5">
                        <span class="font-semibold text-gray-700 truncate">{{ src.document_name }}</span>
                        <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span v-if="src.page" class="text-gray-400">p.{{ src.page }}</span>
                          <span class="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                            {{ formatScore(src.score) }}
                          </span>
                        </div>
                      </div>
                      <p class="text-gray-500 leading-relaxed line-clamp-3">{{ src.chunk_content }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- AI typing / streaming -->
          <div v-if="roomsStore.isAiTyping" class="flex items-start gap-3">
            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <div class="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-gray-800 shadow-sm max-w-[75%]">
              <span v-if="roomsStore.aiStreamBuffer" v-html="renderContent(roomsStore.aiStreamBuffer)"></span>
              <span v-else class="flex items-center gap-1">
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>
              </span>
              <span v-if="roomsStore.aiStreamBuffer" class="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 animate-pulse align-text-bottom"></span>
            </div>
          </div>
        </div>

        <!-- Input area -->
        <div class="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3">
          <div class="flex items-end gap-2 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
            <textarea
              v-model="inputText"
              @keydown="onKeydown"
              :disabled="roomsStore.isAiTyping"
              placeholder="Ask anything about your documents… (Enter to send, Shift+Enter for new line)"
              rows="1"
              class="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none min-h-[1.5rem] max-h-32 overflow-y-auto disabled:opacity-50"
              style="field-sizing: content;"
            ></textarea>
            <button
              @click="sendMessage"
              :disabled="!inputText.trim() || roomsStore.isAiTyping"
              class="flex-shrink-0 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
              </svg>
            </button>
          </div>
          <p class="text-xs text-gray-400 mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      <!-- Info sidebar -->
      <div
        v-if="showInfo"
        class="flex-shrink-0 w-64 border-l border-gray-200 bg-white overflow-y-auto"
      >
        <div class="p-4 space-y-5">
          <!-- Connected users -->
          <div>
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Online</h3>
            <div v-if="roomsStore.connectedUsers.length === 0" class="text-xs text-gray-400">Just you</div>
            <div v-for="user in roomsStore.connectedUsers" :key="user.id" class="flex items-center gap-2 py-1">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span class="text-sm text-gray-700 truncate">{{ user.name }}</span>
            </div>
          </div>

          <!-- Attached documents -->
          <div>
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Documents</h3>
            <div v-if="roomDocs.length === 0" class="text-xs text-gray-400">No documents attached</div>
            <div v-for="doc in roomDocs" :key="doc!.id" class="flex items-start gap-2 py-1">
              <svg class="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              <div class="min-w-0">
                <p class="text-xs font-medium text-gray-700 truncate">{{ doc!.original_name }}</p>
                <p class="text-xs text-gray-400">{{ doc!.chunk_count ?? '—' }} chunks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
