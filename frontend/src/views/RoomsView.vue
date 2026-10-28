<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoomsStore } from '@/stores/rooms.store'
import { useDocumentsStore } from '@/stores/documents.store'
import { Plus, Trash2, MessagesSquare } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { formatDate as fmtDate } from '@/utils/format'
import { useI18n } from 'vue-i18n'

const roomsStore = useRoomsStore()
const docsStore = useDocumentsStore()
const { t } = useI18n()
const deleting = ref<string | null>(null)

onMounted(async () => { await Promise.all([roomsStore.fetchRooms(), docsStore.fetchDocuments()]) })

function docName(id: string) { return docsStore.documents.find(d => d.id === id)?.original_name ?? id }
const formatDate = fmtDate

async function handleDelete(id: string) {
  if (!confirm(t('rooms.confirmDelete'))) return
  deleting.value = id
  try { const { roomsService } = await import('@/services/rooms.service'); await roomsService.delete(id); await roomsStore.fetchRooms() }
  finally { deleting.value = null }
}
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8">
    <PageHeader :title="$t('rooms.title')" :description="$t('rooms.count', { n: roomsStore.rooms.length })">
      <template #actions><UiButton to="/rooms/new"><Plus class="size-4" />{{ $t('rooms.new') }}</UiButton></template>
    </PageHeader>

    <div v-if="roomsStore.rooms.length === 0" class="flex flex-col items-center justify-center rounded-pass border border-dashed border-line bg-surface py-20 text-center">
      <MessagesSquare class="mb-3 size-7 text-ink-3" :stroke-width="1.5" />
      <p class="text-base font-semibold text-ink">{{ $t('rooms.emptyTitle') }}</p>
      <p class="mt-1 max-w-sm text-[14px] text-ink-2">{{ $t('rooms.emptyBody') }}</p>
      <router-link to="/rooms/new" class="mt-3 text-[13px] font-semibold text-ink underline">{{ $t('rooms.createFirst') }}</router-link>
    </div>

    <ul v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="room in roomsStore.rooms" :key="room.id"
        class="group grid grid-cols-[1fr_88px] rounded-pass bg-surface shadow-pass hover:shadow-raised">
        <div class="flex min-w-0 flex-col gap-3 px-5 py-4">
          <router-link :to="`/rooms/${room.id}`" class="truncate text-[16px] font-semibold text-ink hover:underline">{{ room.name }}</router-link>
          <ul class="flex flex-wrap gap-1.5" :aria-label="$t('rooms.documents')">
            <li v-for="docId in room.document_ids.slice(0, 3)" :key="docId"
              class="max-w-full truncate rounded-[4px] border border-line px-2 py-0.5 font-mono text-[12px] text-ink-2">{{ docName(docId) }}</li>
            <li v-if="room.document_ids.length > 3" class="rounded-[4px] border border-line px-2 py-0.5 font-mono text-[12px] text-ink-2">+{{ room.document_ids.length - 3 }}</li>
            <li v-if="room.document_ids.length === 0" class="text-[13px] text-ink-3">{{ $t('rooms.noDocs') }}</li>
          </ul>
          <div class="mt-auto flex items-center justify-between">
            <span class="label">{{ $t('common.opened', { date: formatDate(room.created_at) }) }}</span>
            <button :disabled="deleting === room.id" :aria-label="$t('rooms.delete', { name: room.name })"
              class="rounded p-1.5 text-ink-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 disabled:opacity-40"
              @click="handleDelete(room.id)"><Trash2 class="size-4" /></button>
          </div>
        </div>
        <router-link :to="`/rooms/${room.id}`" tabindex="-1" aria-hidden="true"
          class="flex flex-col items-center justify-center border-l border-dashed border-line hover:bg-sunken">
          <span class="font-display text-[32px] font-semibold leading-none text-ink">{{ room.document_ids.length }}</span>
          <span class="label mt-1">{{ $t('common.docsShort', room.document_ids.length) }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>
