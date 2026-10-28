<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, X, Loader } from 'lucide-vue-next'
import { useDocumentsStore } from '@/stores/documents.store'
import { documentsService } from '@/services/documents.service'
import UiButton from '@/components/ui/UiButton.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { docType, formatSize, formatDateTime as formatDate } from '@/utils/format'
import { useI18n } from 'vue-i18n'
import type { Document } from '@/types/document'

const route = useRoute()
const router = useRouter()
const store = useDocumentsStore()
const { t } = useI18n()

const id = route.params.id as string
const fetched = ref<Document | null>(null)
// Prefer the store copy so status polling updates this page live.
const doc = computed(() => store.documents.find(d => d.id === id) ?? fetched.value)
const loading = ref(true)
const tagInput = ref('')
const savingTags = ref(false)
const deleting = ref(false)

onMounted(async () => {
  if (!doc.value) {
    try {
      fetched.value = await documentsService.get(id)
    } catch { router.push('/documents') }
  }
  loading.value = false
  store.acknowledge(id)
  if (doc.value?.status === 'PROCESSING' || doc.value?.status === 'UPLOADING') store.pollStatus(id)
})

const tags = computed(() => doc.value?.tags ?? [])

function addTag() {
  const t = tagInput.value.trim().toLowerCase()
  if (!t || tags.value.includes(t)) { tagInput.value = ''; return }
  doc.value!.tags = [...tags.value, t]
  tagInput.value = ''
  saveTags()
}

function removeTag(tag: string) {
  doc.value!.tags = tags.value.filter(t => t !== tag)
  saveTags()
}

async function saveTags() {
  if (!doc.value) return
  savingTags.value = true
  try {
    await documentsService.updateTags(doc.value.id, doc.value.tags)
  } finally { savingTags.value = false }
}

async function handleDelete() {
  if (!doc.value || !confirm(t('documents.confirmDelete'))) return
  deleting.value = true
  try { await store.removeDocument(doc.value.id); router.push('/documents') }
  finally { deleting.value = false }
}

</script>

<template>
  <div class="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8">
    <router-link to="/documents" class="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-ink">
      <ArrowLeft class="size-4" />{{ $t('nav.documents') }}
    </router-link>

    <div v-if="loading" class="flex items-center gap-3 py-20 text-ink-2">
      <Loader class="size-5 animate-spin" />{{ $t('detail.loading') }}
    </div>

    <template v-else-if="doc">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <h1 class="min-w-0 text-[26px] font-semibold leading-tight tracking-tight break-words text-ink">{{ doc.original_name }}</h1>
        <StatusChip :status="doc.status" />
      </header>

      <p v-if="doc.status === 'PROCESSING' || doc.status === 'UPLOADING'" class="flex items-center gap-3 rounded-pass border border-dashed border-ink-3 bg-surface px-4 py-3 text-[14px] text-ink-2" role="status">
        <Loader class="size-4 shrink-0 animate-spin" />
        {{ $t('detail.processingNote') }}
      </p>
      <div v-if="doc.status === 'ERROR'" class="rounded-pass border border-danger bg-danger-soft px-4 py-3" role="alert">
        <p class="text-[14px] font-semibold text-danger">{{ $t('detail.failed') }}</p>
        <p v-if="doc.error_message" class="mt-0.5 text-[13px] text-danger">{{ doc.error_message }}</p>
      </div>

      <!-- The document as a pass: identity segments + stub -->
      <section :aria-label="$t('detail.details')" class="grid rounded-pass bg-surface shadow-pass sm:grid-cols-[1fr_140px]">
        <dl class="grid grid-cols-2 sm:grid-cols-4">
          <div class="px-5 py-4">
            <dt class="label">{{ $t('common.type') }}</dt>
            <dd class="mt-1 font-mono text-[15px] font-semibold text-ink">{{ docType(doc.mime_type, doc.original_name) }}</dd>
          </div>
          <div class="border-l border-line px-5 py-4">
            <dt class="label">{{ $t('common.size') }}</dt>
            <dd class="mt-1 font-mono text-[15px] font-semibold text-ink">{{ formatSize(doc.size_bytes) }}</dd>
          </div>
          <div class="border-line px-5 py-4 max-sm:border-t sm:border-l">
            <dt class="label">{{ $t('detail.pages') }}</dt>
            <dd class="mt-1 font-mono text-[15px] font-semibold text-ink">{{ doc.page_count ?? '—' }}</dd>
          </div>
          <div class="border-l border-line px-5 py-4 max-sm:border-t">
            <dt class="label">{{ $t('common.chunks') }}</dt>
            <dd class="mt-1 font-mono text-[15px] font-semibold text-ink">{{ doc.chunk_count ?? '—' }}</dd>
          </div>
          <div class="col-span-2 border-t border-line px-5 py-4">
            <dt class="label">{{ $t('detail.uploaded') }}</dt>
            <dd class="mt-1 font-mono text-[14px] text-ink">{{ formatDate(doc.created_at) }}</dd>
          </div>
          <div class="col-span-2 border-t border-l border-line px-5 py-4">
            <dt class="label">{{ $t('detail.processed') }}</dt>
            <dd class="mt-1 font-mono text-[14px] text-ink">{{ formatDate(doc.processed_at) }}</dd>
          </div>
        </dl>
        <div class="flex flex-col justify-between gap-2 border-dashed border-line px-5 py-4 max-sm:border-t sm:border-l">
          <p class="label">{{ $t('common.document') }}</p>
          <p class="font-display text-[34px] font-semibold leading-none text-ink">{{ docType(doc.mime_type, doc.original_name) }}</p>
          <p class="truncate font-mono text-[11px] text-ink-3" :title="doc.id">{{ doc.id.slice(-8).toUpperCase() }}</p>
        </div>
      </section>

      <!-- Tags -->
      <section aria-labelledby="tags-title" class="rounded-pass bg-surface p-5 shadow-pass">
        <div class="mb-3 flex items-center justify-between">
          <h2 id="tags-title" class="text-base font-semibold text-ink">{{ $t('detail.tags') }}</h2>
          <span v-if="savingTags" class="font-mono text-[12px] text-ink-3" role="status">{{ $t('common.saving') }}</span>
        </div>
        <div class="mb-4 flex flex-wrap gap-1.5">
          <span v-for="tag in tags" :key="tag" class="inline-flex items-center gap-1 rounded-[4px] border border-line pl-2.5 font-mono text-[12px] font-semibold text-ink">
            # {{ tag }}
            <button class="rounded p-1.5 text-ink-3 hover:text-danger" :aria-label="$t('detail.removeTag', { tag })" @click="removeTag(tag)">
              <X class="size-3" />
            </button>
          </span>
          <span v-if="tags.length === 0" class="text-[13px] text-ink-3">{{ $t('detail.noTags') }}</span>
        </div>
        <form class="flex gap-2" @submit.prevent="addTag">
          <label class="flex-1">
            <span class="sr-only">{{ $t('detail.newTag') }}</span>
            <input v-model="tagInput" type="text" :placeholder="$t('detail.addTag')"
              class="min-h-10 w-full rounded-[5px] border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-ink-3 focus:border-line-strong focus:ring-2 focus:ring-alert focus:outline-none" />
          </label>
          <UiButton type="submit" variant="secondary">{{ $t('detail.add') }}</UiButton>
        </form>
      </section>

      <!-- Destructive action, kept apart -->
      <section aria-labelledby="danger-title" class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <div>
          <h2 id="danger-title" class="text-[15px] font-semibold text-ink">{{ $t('detail.deleteTitle') }}</h2>
          <p class="text-[13px] text-ink-2">{{ $t('detail.deleteBody') }}</p>
        </div>
        <UiButton variant="danger" :disabled="deleting" @click="handleDelete">{{ deleting ? $t('detail.deleting') : $t('detail.deleteTitle') }}</UiButton>
      </section>
    </template>
  </div>
</template>
