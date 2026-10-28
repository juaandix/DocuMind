<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { Upload, MessageSquarePlus, UserPlus, ArrowRight, CircleCheck } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useDocumentsStore } from '@/stores/documents.store'
import { useRoomsStore } from '@/stores/rooms.store'
import { useWorkspaceStore } from '@/stores/workspace.store'
import { useNotificationsStore } from '@/stores/notifications.store'
import StatusChip from '@/components/ui/StatusChip.vue'
import { docType, formatShortDate, formatTime } from '@/utils/format'
import type { Document } from '@/types/document'
import { useI18n } from 'vue-i18n'

const auth = useAuthStore()
const docsStore = useDocumentsStore()
const roomsStore = useRoomsStore()
const wsStore = useWorkspaceStore()
const notifStore = useNotificationsStore()
const { t } = useI18n()
let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await Promise.all([docsStore.fetchDocuments(), roomsStore.fetchRooms(), wsStore.fetchWorkspace()])
  pollTimer = setInterval(() => {
    if (docsStore.documents.some(d => d.status === 'PROCESSING' || d.status === 'UPLOADING')) docsStore.fetchDocuments()
  }, 5000)
})
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })

const counts = computed(() => {
  const d = docsStore.documents
  return {
    total: d.length,
    ready: d.filter(x => x.status === 'READY').length,
    inProgress: d.filter(x => x.status === 'PROCESSING' || x.status === 'UPLOADING').length,
    errors: d.filter(x => x.status === 'ERROR').length,
  }
})

const storagePercent = computed(() => {
  const ws = wsStore.workspace
  if (!ws?.storage_limit_bytes) return 0
  return Math.min(100, Math.round((ws.storage_used_bytes / ws.storage_limit_bytes) * 100))
})

// Departures: what needs attention, ranked: just finished, in progress, failed.
// Rows move in place when they rerank; a finished row holds yellow until opened.
function rank(doc: Document) {
  if (docsStore.changedIds.has(doc.id)) return 0
  if (doc.status === 'PROCESSING' || doc.status === 'UPLOADING') return 1
  if (doc.status === 'ERROR') return 2
  return 3
}
const departures = computed(() =>
  docsStore.documents
    .filter(d => rank(d) < 3)
    .sort((a, b) => rank(a) - rank(b) || b.created_at.localeCompare(a.created_at))
    .slice(0, 5),
)

const recent = computed(() =>
  [...docsStore.documents].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6),
)

const summary = computed(() => {
  const parts: string[] = []
  if (docsStore.changedIds.size) parts.push(t('dashboard.justFinished', { n: docsStore.changedIds.size }, docsStore.changedIds.size))
  if (counts.value.inProgress) parts.push(t('dashboard.processing', { n: counts.value.inProgress }))
  if (counts.value.errors) parts.push(t('dashboard.failed', { n: counts.value.errors }))
  return parts.length ? parts.join(' · ') : t('dashboard.calm')
})

const greeting = computed(() => {
  const h = new Date().getHours()
  const name = auth.user?.full_name?.split(' ')[0] ?? ''
  if (h < 12) return t('dashboard.morning', { name })
  if (h < 17) return t('dashboard.afternoon', { name })
  return t('dashboard.evening', { name })
})
const isNewUser = computed(() => docsStore.documents.length === 0 && roomsStore.rooms.length === 0)

function relTime(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return t('time.now')
  if (mins < 60) return t('time.minutes', { n: mins })
  const h = Math.floor(mins / 60)
  return h < 24 ? t('time.hours', { n: h }) : t('time.days', { n: Math.floor(h / 24) })
}

const onboarding = [
  { to: '/documents/upload', step: 1, title: 'dashboard.step1', body: 'dashboard.step1Body' },
  { to: '/rooms/new', step: 2, title: 'dashboard.step2', body: 'dashboard.step2Body' },
  { to: '/settings/members', step: 3, title: 'dashboard.step3', body: 'dashboard.step3Body' },
]
</script>

<template>
  <div>
    <!-- Departures band -->
    <section class="border-b border-rail-2 bg-rail text-rail-ink" aria-labelledby="greeting">
      <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-7 pb-8 sm:px-8">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 id="greeting" class="text-[28px] font-semibold leading-tight tracking-[-0.015em] text-white">{{ greeting }}</h1>
            <p class="mt-1 text-[15px] text-rail-ink-2">{{ summary }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <router-link to="/settings/members" class="press inline-flex min-h-10 items-center gap-2 rounded-[5px] px-4 text-sm font-semibold text-rail-ink hover:bg-rail-2 hover:text-white">
              <UserPlus class="size-4" />{{ $t('dashboard.invite') }}
            </router-link>
            <router-link to="/rooms/new" class="press inline-flex min-h-10 items-center gap-2 rounded-[5px] border border-rail-ink-2/50 px-4 text-sm font-semibold text-white hover:border-white">
              <MessageSquarePlus class="size-4" />{{ $t('dashboard.newRoom') }}
            </router-link>
            <router-link to="/documents/upload" class="press inline-flex min-h-10 items-center gap-2 rounded-[5px] bg-alert px-4 text-sm font-semibold text-on-alert hover:brightness-95">
              <Upload class="size-4" />{{ $t('dashboard.upload') }}
            </router-link>
          </div>
        </div>

        <div v-if="!isNewUser" class="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <dl class="grid grid-cols-3 rounded-pass border border-rail-2 sm:grid-cols-5">
            <div class="px-4 py-3">
              <dt class="label truncate !text-rail-ink-2">{{ $t('dashboard.documents') }}</dt>
              <dd class="mt-1 font-display text-[38px] font-semibold leading-none text-white">{{ counts.total }}</dd>
            </div>
            <div class="border-l border-rail-2 px-4 py-3">
              <dt class="label truncate !text-rail-ink-2">{{ $t('dashboard.ready') }}</dt>
              <dd class="mt-1 font-display text-[38px] font-semibold leading-none text-white">{{ counts.ready }}</dd>
            </div>
            <div class="border-l border-rail-2 px-4 py-3">
              <dt class="label truncate !text-rail-ink-2">{{ $t('dashboard.processingLabel') }}</dt>
              <dd class="mt-1 font-display text-[38px] font-semibold leading-none text-white">{{ counts.inProgress }}</dd>
            </div>
            <div class="border-rail-2 px-4 py-3 max-sm:border-t sm:border-l">
              <dt class="label truncate !text-rail-ink-2">{{ $t('dashboard.failedLabel') }}</dt>
              <dd :class="['mt-1 font-display text-[38px] font-semibold leading-none', counts.errors ? 'text-danger-on-ink' : 'text-white']">{{ counts.errors }}</dd>
            </div>
            <div class="col-span-2 border-l border-rail-2 px-4 py-3 max-sm:border-t sm:col-span-1">
              <dt class="label truncate !text-rail-ink-2">{{ $t('dashboard.storage') }}</dt>
              <dd class="mt-1 font-display text-[38px] font-semibold leading-none text-white">{{ storagePercent }}<span class="text-[22px]">%</span></dd>
            </div>
          </dl>

          <div class="min-w-0 rounded-pass border border-rail-2" aria-live="polite">
            <p v-if="departures.length === 0" class="flex h-full min-h-[72px] items-center gap-3 px-4 text-[14px] text-rail-ink">
              <CircleCheck class="size-5 text-alert" />{{ $t('dashboard.allReady', { n: counts.total }) }}
            </p>
            <TransitionGroup v-else tag="ul" name="rerank">
              <li v-for="doc in departures" :key="doc.id"
                :class="['grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-t border-rail-2 px-4 py-2.5 transition-colors duration-300 first:border-t-0',
                  docsStore.changedIds.has(doc.id) ? 'bg-alert text-on-alert' : '']">
                <router-link :to="`/documents/${doc.id}`" class="truncate text-[14px] font-semibold hover:underline"
                  :class="docsStore.changedIds.has(doc.id) ? 'text-on-alert' : 'text-white'"
                  @click="docsStore.acknowledge(doc.id)">{{ doc.original_name }}</router-link>
                <span v-if="docsStore.changedIds.has(doc.id)" class="rounded-[4px] border border-on-alert px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em]">
                  {{ doc.status === 'READY' ? $t('status.nowReady') : $t('status.nowFailed') }}
                </span>
                <span v-else-if="doc.status === 'ERROR'" class="rounded-[4px] border border-danger-on-ink px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-danger-on-ink">{{ $t('status.ERROR') }}</span>
                <span v-else class="rounded-[4px] border border-dashed border-rail-ink-2 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-rail-ink">{{ $t('status.PROCESSING') }}</span>
                <span class="w-12 text-right font-mono text-[12px]" :class="docsStore.changedIds.has(doc.id) ? 'text-on-alert' : 'text-rail-ink-2'">{{ formatTime(doc.processed_at ?? doc.created_at) }}</span>
              </li>
            </TransitionGroup>
          </div>
        </div>
      </div>
    </section>

    <div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8">
      <!-- Onboarding (new users only) -->
      <section v-if="isNewUser" aria-labelledby="onboarding-title" class="rounded-pass bg-surface shadow-pass">
        <h2 id="onboarding-title" class="border-b border-line px-5 py-4 text-base font-semibold text-ink">{{ $t('dashboard.getStarted') }}</h2>
        <ol class="grid sm:grid-cols-3">
          <li v-for="item in onboarding" :key="item.step" class="border-line max-sm:border-t max-sm:first:border-t-0 sm:border-l sm:first:border-l-0">
            <router-link :to="item.to" class="group flex h-full flex-col gap-3 p-5 hover:bg-sunken">
              <span class="font-display text-[34px] font-semibold leading-none text-ink-3 group-hover:text-ink">{{ item.step }}</span>
              <span>
                <span class="block text-[15px] font-semibold text-ink">{{ $t(item.title) }}</span>
                <span class="mt-0.5 block text-[13px] text-ink-2">{{ $t(item.body) }}</span>
              </span>
            </router-link>
          </li>
        </ol>
      </section>

      <div v-else class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <!-- Recent documents -->
        <section aria-labelledby="recent-title" class="overflow-hidden rounded-pass bg-surface shadow-pass">
          <div class="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 id="recent-title" class="text-base font-semibold text-ink">{{ $t('dashboard.recent') }}</h2>
            <router-link to="/documents" class="inline-flex items-center gap-1 text-[13px] font-semibold text-ink hover:underline">
              {{ $t('common.viewAll') }} <ArrowRight class="size-3.5" />
            </router-link>
          </div>
          <table class="w-full table-fixed text-left">
            <thead>
              <tr class="label">
                <th class="px-5 py-2.5 font-semibold">{{ $t('common.document') }}</th>
                <th class="hidden w-20 px-3 py-2.5 font-semibold sm:table-cell">{{ $t('common.type') }}</th>
                <th class="hidden w-24 px-3 py-2.5 text-right font-semibold sm:table-cell">{{ $t('common.chunks') }}</th>
                <th class="w-36 px-3 py-2.5 font-semibold">{{ $t('common.status') }}</th>
                <th class="hidden w-24 px-5 py-2.5 text-right font-semibold md:table-cell">{{ $t('common.added') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in recent" :key="doc.id"
                :class="['border-t border-line', docsStore.changedIds.has(doc.id) ? 'bg-alert-soft' : 'hover:bg-sunken']">
                <td class="px-5 py-3">
                  <router-link :to="`/documents/${doc.id}`" class="block truncate text-[14px] font-semibold text-ink hover:underline"
                    @click="docsStore.acknowledge(doc.id)">{{ doc.original_name }}</router-link>
                </td>
                <td class="hidden px-3 py-3 font-mono text-[13px] text-ink-2 sm:table-cell">{{ docType(doc.mime_type, doc.original_name) }}</td>
                <td class="hidden px-3 py-3 text-right font-mono text-[13px] text-ink-2 sm:table-cell">{{ doc.chunk_count ?? '—' }}</td>
                <td class="px-3 py-3"><StatusChip :status="doc.status" :changed="docsStore.changedIds.has(doc.id)" /></td>
                <td class="hidden px-5 py-3 text-right font-mono text-[13px] text-ink-2 md:table-cell">{{ formatShortDate(doc.created_at) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="docsStore.documents.length === 0" class="px-5 py-10 text-center">
            <p class="text-sm font-semibold text-ink">{{ $t('dashboard.noDocs') }}</p>
            <router-link to="/documents/upload" class="mt-1 inline-block text-[13px] font-semibold text-ink underline">{{ $t('dashboard.uploadFirst') }}</router-link>
          </div>
        </section>

        <div class="flex flex-col gap-8">
          <!-- Rooms -->
          <section aria-labelledby="rooms-title" class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2 id="rooms-title" class="text-base font-semibold text-ink">{{ $t('dashboard.rooms') }}</h2>
              <router-link to="/rooms" class="inline-flex items-center gap-1 text-[13px] font-semibold text-ink hover:underline">
                {{ $t('common.viewAll') }} <ArrowRight class="size-3.5" />
              </router-link>
            </div>
            <p v-if="roomsStore.rooms.length === 0" class="rounded-pass border border-dashed border-line px-4 py-6 text-center text-[13px] text-ink-2">
              {{ $t('dashboard.noRooms') }} <router-link to="/rooms/new" class="font-semibold text-ink underline">{{ $t('dashboard.createRoom') }}</router-link>
            </p>
            <router-link v-for="room in roomsStore.rooms.slice(0, 4)" :key="room.id" :to="`/rooms/${room.id}`"
              class="grid grid-cols-[1fr_auto] rounded-pass bg-surface shadow-pass hover:shadow-raised">
              <span class="min-w-0 px-4 py-3">
                <span class="block truncate text-[15px] font-semibold text-ink">{{ room.name }}</span>
                <span class="label mt-1 block">{{ $t('common.opened', { date: formatShortDate(room.created_at) }) }}</span>
              </span>
              <span class="flex w-20 flex-col items-center justify-center border-l border-dashed border-line">
                <span class="font-display text-[26px] font-semibold leading-none text-ink">{{ room.document_ids.length }}</span>
                <span class="label mt-1">{{ $t('common.docsShort', room.document_ids.length) }}</span>
              </span>
            </router-link>
          </section>

          <!-- Activity, from workspace notifications -->
          <section aria-labelledby="activity-title" class="flex flex-col gap-3">
            <h2 id="activity-title" class="text-base font-semibold text-ink">{{ $t('dashboard.activity') }}</h2>
            <p v-if="notifStore.items.length === 0" class="rounded-pass border border-dashed border-line px-4 py-6 text-center text-[13px] text-ink-2">
              {{ $t('dashboard.activityEmpty') }}
            </p>
            <ol v-else class="overflow-hidden rounded-pass bg-surface shadow-pass">
              <li v-for="n in notifStore.items.slice(0, 5)" :key="n._id" class="grid grid-cols-[1fr_auto] gap-3 border-t border-line px-4 py-3 first:border-t-0">
                <span class="min-w-0">
                  <span class="block truncate text-[14px] font-semibold text-ink">{{ n.title }}</span>
                  <span class="block truncate text-[13px] text-ink-2">{{ n.body }}</span>
                </span>
                <span class="font-mono text-[12px] text-ink-3">{{ relTime(n.created_at) }}</span>
              </li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
