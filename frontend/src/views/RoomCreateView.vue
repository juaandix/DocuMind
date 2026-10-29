<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomsStore } from '@/stores/rooms.store'
import { useDocumentsStore } from '@/stores/documents.store'
import { ArrowLeft, Check } from 'lucide-vue-next'
import PageHeader from '@/components/ui/PageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import { docType } from '@/utils/format'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const roomsStore = useRoomsStore()
const docsStore = useDocumentsStore()
const { t } = useI18n()
const nameError = ref('')
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
  if (!name.value.trim()) { nameError.value = t('roomNew.nameRequired'); return }
  nameError.value = ''; error.value = ''; creating.value = true
  try {
    const room = await roomsStore.createRoom(name.value.trim(), selectedIds.value)
    router.push(`/rooms/${room.id}`)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? t('roomNew.failed')
  } finally { creating.value = false }
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
    <router-link to="/rooms" class="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-ink">
      <ArrowLeft class="size-4" />{{ $t('nav.rooms') }}
    </router-link>
    <PageHeader :title="$t('roomNew.title')" :description="$t('roomNew.description')" />

    <form class="flex flex-col gap-6" novalidate @submit.prevent="submit">
      <section class="rounded-pass bg-surface p-5 shadow-pass">
        <UiInput v-model="name" :label="$t('roomNew.name')" :placeholder="$t('roomNew.namePlaceholder')" required
          :error="nameError || undefined" />
      </section>

      <section class="overflow-hidden rounded-pass bg-surface shadow-pass" aria-labelledby="docs-title">
        <div class="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="docs-title" class="text-[15px] font-semibold text-ink">{{ $t('roomNew.documents') }}</h2>
          <span v-if="selectedIds.length > 0" class="rounded-[4px] bg-alert px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-on-alert">{{ $t('roomNew.selected', { n: selectedIds.length }, selectedIds.length) }}</span>
        </div>
        <div v-if="readyDocs.length === 0" class="px-5 py-10 text-center">
          <p class="text-[14px] text-ink-2">{{ $t('roomNew.noneReady') }}</p>
          <router-link to="/documents/upload" class="mt-1 inline-block text-[13px] font-semibold text-ink underline">{{ $t('roomNew.uploadFirst') }}</router-link>
        </div>
        <ul v-else>
          <li v-for="doc in readyDocs" :key="doc.id" class="border-t border-line first:border-t-0">
            <label :class="['relative flex cursor-pointer items-center gap-4 px-5 py-3 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-inset has-[input:focus-visible]:ring-alert', selectedIds.includes(doc.id) ? 'bg-alert-soft' : 'hover:bg-sunken']">
              <input type="checkbox" class="sr-only" :checked="selectedIds.includes(doc.id)" @change="toggleDoc(doc.id)" />
              <span aria-hidden="true" :class="['flex size-5 shrink-0 items-center justify-center rounded-[4px] border',
                selectedIds.includes(doc.id) ? 'border-line-strong bg-primary text-on-primary' : 'border-ink-3']">
                <Check v-if="selectedIds.includes(doc.id)" class="size-3.5" :stroke-width="3" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[14px] font-semibold text-ink">{{ doc.original_name }}</span>
                <span class="block font-mono text-[12px] text-ink-3">{{ $t('common.nChunks', { n: doc.chunk_count }) }}</span>
              </span>
              <span class="font-mono text-[12px] text-ink-2">{{ docType(doc.mime_type, doc.original_name) }}</span>
            </label>
          </li>
        </ul>
      </section>

      <p v-if="error" class="rounded-pass border border-danger bg-danger-soft px-4 py-3 text-[14px] text-danger" role="alert">{{ error }}</p>

      <div class="flex flex-wrap gap-2">
        <UiButton type="submit" :disabled="creating">{{ creating ? $t('roomNew.creating') : $t('roomNew.create') }}</UiButton>
        <UiButton to="/rooms" variant="ghost">{{ $t('common.cancel') }}</UiButton>
      </div>
    </form>
  </div>
</template>
