<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Pencil, Download, PanelRight, X, ArrowUp, Check } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import SourcePass from '@/components/ui/SourcePass.vue'
import UiAvatar from '@/components/ui/UiAvatar.vue'
import { formatTime } from '@/utils/format'
import { useI18n } from 'vue-i18n'
import { useRoomsStore } from '@/stores/rooms.store'
import { useDocumentsStore } from '@/stores/documents.store'
import { useAuthStore } from '@/stores/auth.store'
import type { Message } from '@/types/room'

const route = useRoute()
const roomsStore = useRoomsStore()
const docsStore = useDocumentsStore()
const authStore = useAuthStore()
const { t } = useI18n()

const roomId = computed(() => route.params.id as string)
const inputText = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const showInfo = ref(false)
// Which answer's sources the side panel shows, and which pass is highlighted.
const selectedMsgId = ref<string | null>(null)
const activeSource = ref<number | null>(null)
const exporting = ref(false)
const exportTaskId = ref<string | null>(null)
const typingTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

// Room rename
const editingName = ref(false)
const pendingName = ref('')
const savingName = ref(false)

function startRename() {
  pendingName.value = room.value?.name ?? ''
  editingName.value = true
}

async function saveRename() {
  if (!pendingName.value.trim() || pendingName.value === room.value?.name) { editingName.value = false; return }
  savingName.value = true
  try {
    const { roomsService } = await import('@/services/rooms.service')
    const updated = await roomsService.update(roomId.value, { name: pendingName.value.trim() })
    roomsStore.activeRoom = updated
    const idx = roomsStore.rooms.findIndex(r => r.id === roomId.value)
    if (idx >= 0) roomsStore.rooms[idx] = updated
    editingName.value = false
  } finally { savingName.value = false }
}

function onRenameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') saveRename()
  if (e.key === 'Escape') editingName.value = false
}

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

async function showSources(msgId: string, index: number | null = null) {
  selectedMsgId.value = msgId
  activeSource.value = index
  showInfo.value = true
  await nextTick()
  document.querySelector(`[data-source="${index}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

const sourceMsg = computed(() => {
  const withSources = roomsStore.messages.filter(m => m.role === 'assistant' && m.sources?.length)
  return withSources.find(m => m.id === selectedMsgId.value) ?? withSources.at(-1) ?? null
})

function authorName(msg: Message) {
  if (isOwnMessage(msg)) return t('common.you')
  return roomsStore.connectedUsers.find(u => u.id === msg.author_id)?.name ?? t('common.member')
}

function isOwnMessage(msg: Message) { return msg.author_id === authStore.user?.id }

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
    .replace(/`([^`]+)`/g, '<code class="rounded-[3px] bg-sunken px-1 py-0.5 font-mono text-[0.88em] text-ink">$1</code>')
    .replace(/\n/g, '<br/>')
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Room header: identity segments, like the top of a pass -->
    <header class="flex shrink-0 flex-wrap items-stretch border-b border-line bg-surface">
      <div class="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 sm:px-6">
        <router-link to="/rooms" class="shrink-0 rounded p-1.5 text-ink-2 hover:bg-sunken hover:text-ink" :aria-label="$t('room.back')">
          <ArrowLeft class="size-5" />
        </router-link>
        <template v-if="editingName">
          <label class="min-w-0 flex-1">
            <span class="sr-only">{{ $t('room.roomName') }}</span>
            <input v-model="pendingName" autofocus
              class="min-h-9 w-full max-w-sm rounded-[5px] border border-line-strong bg-surface px-2.5 text-[17px] font-semibold text-ink focus:ring-2 focus:ring-alert focus:outline-none"
              @keydown="onRenameKeydown" @blur="saveRename" />
          </label>
        </template>
        <template v-else>
          <h1 class="truncate text-[19px] font-semibold tracking-tight text-ink" @dblclick="startRename">{{ room?.name ?? 'Chat' }}</h1>
          <button class="shrink-0 rounded p-1.5 text-ink-3 hover:bg-sunken hover:text-ink" :aria-label="$t('room.rename')" :title="$t('room.rename')" @click="startRename">
            <Pencil class="size-3.5" />
          </button>
        </template>
      </div>

      <dl class="hidden items-stretch sm:flex">
        <div class="flex flex-col justify-center border-l border-line px-5">
          <dt class="label">{{ $t('room.docs') }}</dt>
          <dd class="font-display text-[22px] font-semibold leading-none text-ink">{{ roomDocs.length }}</dd>
        </div>
        <div class="flex flex-col justify-center border-l border-line px-5">
          <dt class="label">{{ $t('room.hereNow') }}</dt>
          <dd class="font-display text-[22px] font-semibold leading-none text-ink">{{ Math.max(1, roomsStore.connectedUsers.length) }}</dd>
        </div>
      </dl>

      <div class="flex items-center gap-2 border-l border-line px-4">
        <span v-if="exportTaskId" class="inline-flex items-center gap-1.5 rounded-[4px] bg-alert px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-on-alert" role="status">
          <Check class="size-3.5" />{{ $t('room.exportQueued') }}
        </span>
        <UiButton v-else variant="secondary" size="sm" :disabled="exporting" @click="handleExport">
          <Download class="size-4" /><span class="max-sm:sr-only">{{ $t('room.exportPdf') }}</span>
        </UiButton>
        <button :aria-pressed="showInfo" :aria-label="$t('room.togglePanel')"
          :class="['rounded p-2 xl:hidden', showInfo ? 'bg-primary text-on-primary' : 'text-ink-2 hover:bg-sunken hover:text-ink']"
          @click="showInfo = !showInfo">
          <PanelRight class="size-4" />
        </button>
      </div>
    </header>

    <div class="relative flex min-h-0 flex-1">
      <!-- Conversation -->
      <section class="flex min-w-0 flex-1 flex-col" :aria-label="$t('room.conversation')">
        <div ref="messagesEl" class="flex-1 overflow-y-auto">
          <div v-if="roomsStore.messages.length === 0 && !roomsStore.isAiTyping" class="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
            <p class="font-display text-[44px] font-semibold leading-none text-ink">{{ roomDocs.length }}</p>
            <p class="label mt-1">{{ $t('room.onBoard', roomDocs.length) }}</p>
            <p class="mt-4 text-base font-semibold text-ink">{{ $t('room.askTitle') }}</p>
            <p class="mt-1 max-w-sm text-[14px] text-ink-2">{{ $t('room.askBody') }}</p>
          </div>

          <ol class="mx-auto flex max-w-3xl flex-col gap-7 px-4 py-8 sm:px-8">
            <li v-for="msg in roomsStore.messages" :key="msg.id" class="grid grid-cols-[32px_1fr] gap-x-3.5">
              <UiAvatar :name="authorName(msg)" :ai="msg.role === 'assistant'" class="mt-0.5" />
              <div class="min-w-0">
              <p class="mb-1 flex items-baseline gap-2">
                <span class="text-[14px] font-semibold text-ink">{{ msg.role === 'assistant' ? 'DocuMind' : authorName(msg) }}</span>
                <span class="font-mono text-[12px] text-ink-3">{{ formatTime(msg.created_at) }}</span>
              </p>
              <div v-if="msg.role === 'assistant'">
                <div class="text-[16px] leading-[1.7] text-ink" v-html="renderContent(msg.content)"></div>
                <div v-if="msg.sources?.length" class="mt-3 flex flex-wrap items-center gap-1.5">
                  <span class="label mr-1">{{ $t('room.sources') }}</span>
                  <button v-for="(src, i) in msg.sources" :key="i"
                    :aria-pressed="sourceMsg?.id === msg.id && activeSource === i"
                    :title="src.document_name"
                    :class="[
                      'press min-h-7 rounded-[4px] px-2 font-mono text-[12px] font-semibold',
                      sourceMsg?.id === msg.id && activeSource === i ? 'bg-alert text-on-alert' : 'bg-primary text-on-primary hover:bg-primary-hover',
                    ]"
                    @click="showSources(msg.id, i)">S{{ i + 1 }}</button>
                </div>
              </div>
              <div v-else class="text-[16px] leading-[1.65] text-ink" v-html="renderContent(msg.content)"></div>
              </div>
            </li>

            <li v-if="roomsStore.isAiTyping" aria-live="polite" class="grid grid-cols-[32px_1fr] gap-x-3.5">
              <UiAvatar name="DocuMind" ai class="mt-0.5" />
              <div class="min-w-0">
              <p class="mb-1 text-[14px] font-semibold text-ink">DocuMind</p>
              <div v-if="roomsStore.aiStreamBuffer" class="text-[16px] leading-[1.7] text-ink">
                <span v-html="renderContent(roomsStore.aiStreamBuffer)"></span><span class="ml-0.5 inline-block h-4 w-2 bg-alert align-text-bottom" aria-hidden="true"></span>
              </div>
              <p v-else class="text-[15px] text-ink-2">{{ $t('room.reading', { n: roomDocs.length }, roomDocs.length) }}</p>
              </div>
            </li>
          </ol>
        </div>

        <!-- Composer -->
        <div class="shrink-0 border-t border-line bg-surface px-4 py-4 sm:px-8">
          <form class="mx-auto max-w-3xl" @submit.prevent="sendMessage">
            <div class="flex items-end gap-2 rounded-[6px] border border-line-strong bg-surface p-2 pl-4 focus-within:ring-2 focus-within:ring-alert">
              <label class="flex-1">
                <span class="sr-only">{{ $t('room.message') }}</span>
                <textarea v-model="inputText" :disabled="roomsStore.isAiTyping" rows="1"
                  :placeholder="$t('room.placeholder')"
                  class="max-h-32 min-h-10 w-full resize-none bg-transparent py-2 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none disabled:opacity-50"
                  style="field-sizing: content;" @keydown="onKeydown"></textarea>
              </label>
              <UiButton type="submit" :disabled="!inputText.trim() || roomsStore.isAiTyping" :aria-label="$t('room.sendLabel')">
                <ArrowUp class="size-4" /><span class="max-sm:hidden">{{ $t('room.send') }}</span>
              </UiButton>
            </div>
            <p class="mt-1.5 px-1 text-[12px] text-ink-3">{{ $t('room.hint') }}</p>
          </form>
        </div>
      </section>

      <!-- Room panel: sources for the selected answer, documents, people -->
      <aside :class="[
        'w-full max-w-[420px] shrink-0 flex-col overflow-y-auto border-l border-line bg-ground',
        'max-xl:absolute max-xl:inset-y-0 max-xl:right-0 max-xl:z-20 max-xl:shadow-pass xl:flex',
        showInfo ? 'flex' : 'hidden',
      ]" :aria-label="$t('room.panel')">
        <div class="flex items-center justify-between px-5 pt-5 xl:hidden">
          <span class="label">{{ $t('room.panel') }}</span>
          <button class="rounded p-1.5 text-ink-2 hover:bg-sunken hover:text-ink" :aria-label="$t('room.closePanel')" @click="showInfo = false"><X class="size-4" /></button>
        </div>

        <section class="flex flex-col gap-3 p-5" aria-labelledby="sources-title">
          <h2 id="sources-title" class="text-[15px] font-semibold text-ink">{{ $t('room.sources') }}</h2>
          <p v-if="!sourceMsg" class="rounded-pass border border-dashed border-line px-4 py-6 text-center text-[13px] text-ink-2">
            {{ $t('room.sourcesEmpty') }}
          </p>
          <template v-else>
            <SourcePass v-for="(src, i) in sourceMsg.sources" :key="i"
              :index="i + 1" :document-name="src.document_name" :page="src.page" :score="src.score" :excerpt="src.chunk_content"
              :active="activeSource === i" :data-source="i" />
          </template>
        </section>

        <section class="flex flex-col gap-2 border-t border-line p-5" aria-labelledby="docs-title">
          <div class="flex items-center justify-between">
            <h2 id="docs-title" class="text-[15px] font-semibold text-ink">{{ $t('room.documents') }}</h2>
            <button v-if="!editingDocs" class="text-[13px] font-semibold text-ink underline-offset-4 hover:underline" @click="startEditDocs">{{ $t('common.edit') }}</button>
            <div v-else class="flex gap-3">
              <button class="text-[13px] font-semibold text-ink-2 hover:text-ink" @click="cancelEditDocs">{{ $t('common.cancel') }}</button>
              <button class="text-[13px] font-semibold text-ink underline disabled:opacity-50" :disabled="savingDocs" @click="saveDocChanges">
                {{ savingDocs ? $t('common.saving') : $t('common.save') }}
              </button>
            </div>
          </div>

          <template v-if="!editingDocs">
            <p v-if="roomDocs.length === 0" class="text-[13px] text-ink-3">{{ $t('room.noneAttached') }}</p>
            <div v-for="doc in roomDocs" :key="doc!.id" class="flex items-center justify-between gap-3 py-1.5">
              <div class="min-w-0">
                <p class="truncate text-[14px] font-semibold text-ink">{{ doc!.original_name }}</p>
                <p class="font-mono text-[12px] text-ink-3">{{ $t('common.nChunks', { n: doc!.chunk_count ?? '—' }) }}</p>
              </div>
              <StatusChip :status="doc!.status" />
            </div>
          </template>

          <template v-else>
            <p v-if="readyDocs.length === 0" class="py-2 text-[13px] text-ink-3">{{ $t('room.noneReady') }}</p>
            <label v-for="doc in readyDocs" :key="doc.id"
              :class="['flex cursor-pointer items-center gap-3 rounded-[5px] px-2 py-2', pendingDocIds.includes(doc.id) ? 'bg-surface' : 'hover:bg-surface']">
              <input type="checkbox" :checked="pendingDocIds.includes(doc.id)" class="size-4 shrink-0 accent-[var(--dm-ink)]" @change="togglePendingDoc(doc.id)" />
              <span class="min-w-0">
                <span class="block truncate text-[14px] font-semibold text-ink">{{ doc.original_name }}</span>
                <span class="block font-mono text-[12px] text-ink-3">{{ $t('common.nChunks', { n: doc.chunk_count ?? '—' }) }}</span>
              </span>
            </label>
          </template>
        </section>

        <section class="flex flex-col gap-2 border-t border-line p-5" aria-labelledby="online-title">
          <h2 id="online-title" class="text-[15px] font-semibold text-ink">{{ $t('room.hereNow') }}</h2>
          <p v-if="roomsStore.connectedUsers.length === 0" class="text-[13px] text-ink-3">{{ $t('room.justYou') }}</p>
          <p v-for="user in roomsStore.connectedUsers" :key="user.id" class="flex items-center gap-2.5 text-[14px] text-ink">
            <UiAvatar :name="user.name" size="sm" />{{ user.name }}
          </p>
        </section>
      </aside>
    </div>
  </div>
</template>
