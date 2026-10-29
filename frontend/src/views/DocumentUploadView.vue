<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, Upload, CircleAlert } from 'lucide-vue-next'
import { useDocumentsStore } from '@/stores/documents.store'
import PageHeader from '@/components/ui/PageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import StatusChip from '@/components/ui/StatusChip.vue'
import { docType, formatSize } from '@/utils/format'
import { useI18n } from 'vue-i18n'

const store = useDocumentsStore()
const { t } = useI18n()
const dragActive = ref(false)
const uploading = ref(false)
const uploadedDocId = ref<string | null>(null)
const progress = ref(0)
const error = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
// Must match backend settings.allowed_mime_types.
const ACCEPTED = '.pdf,.docx,.txt,.csv'

const uploaded = computed(() => store.documents.find(d => d.id === uploadedDocId.value) ?? null)

function onDrop(e: DragEvent) {
  dragActive.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) startUpload(file)
}
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) startUpload(file)
}
async function startUpload(file: File) {
  error.value = ''; uploading.value = true; progress.value = 0
  try {
    const doc = await store.upload(file, (pct) => { progress.value = pct })
    uploadedDocId.value = doc.id
    store.pollStatus(doc.id)
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? t('upload.failed')
  } finally { uploading.value = false; if (fileInput.value) fileInput.value.value = '' }
}
function reset() {
  uploadedDocId.value = null
  progress.value = 0
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
    <router-link to="/documents" class="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-ink">
      <ArrowLeft class="size-4" />{{ $t('nav.documents') }}
    </router-link>
    <PageHeader :title="$t('upload.title')" :description="$t('upload.description')" />

    <!-- Uploaded: follow its processing live -->
    <section v-if="uploadedDocId" aria-live="polite" class="grid rounded-pass bg-surface shadow-pass sm:grid-cols-[1fr_150px]">
      <div class="flex min-w-0 flex-col gap-3 px-5 py-5">
        <p class="label">{{ $t('upload.uploaded') }}</p>
        <p class="truncate text-[17px] font-semibold text-ink">{{ uploaded?.original_name ?? $t('upload.yourDocument') }}</p>
        <div class="flex flex-wrap items-center gap-3">
          <StatusChip :status="uploaded?.status ?? 'PROCESSING'" :changed="uploaded ? store.changedIds.has(uploaded.id) : false" />
          <span class="text-[13px] text-ink-2">
            {{ uploaded?.status === 'READY' ? $t('upload.readyNote') : uploaded?.status === 'ERROR' ? (uploaded.error_message ?? $t('upload.failedNote')) : $t('upload.processingNote') }}
          </span>
        </div>
        <div class="mt-1 flex flex-wrap gap-2">
          <UiButton :to="`/documents/${uploadedDocId}`" variant="secondary" size="sm">{{ $t('upload.open') }}</UiButton>
          <UiButton variant="ghost" size="sm" @click="reset">{{ $t('upload.another') }}</UiButton>
        </div>
      </div>
      <div class="flex flex-col justify-between gap-2 border-dashed border-line px-5 py-5 max-sm:border-t sm:border-l">
        <p class="label">{{ $t('common.type') }}</p>
        <p class="font-display text-[38px] font-semibold leading-none text-ink">{{ uploaded ? docType(uploaded.mime_type, uploaded.original_name) : '—' }}</p>
        <p class="font-mono text-[12px] text-ink-3">{{ uploaded ? formatSize(uploaded.size_bytes) : '' }}</p>
      </div>
    </section>

    <!-- Drop zone -->
    <template v-else>
      <label
        :class="[
          'flex cursor-pointer flex-col items-center justify-center gap-4 rounded-pass border-2 border-dashed px-6 py-16 text-center',
          dragActive ? 'border-line-strong bg-alert-soft' : 'border-line bg-surface hover:border-ink-3',
          uploading && 'pointer-events-none',
        ]"
        @dragover.prevent="dragActive = true" @dragleave.prevent="dragActive = false" @drop.prevent="onDrop">
        <input ref="fileInput" type="file" :accept="ACCEPTED" class="sr-only" :disabled="uploading" @change="onFileChange" />
        <span class="flex size-12 items-center justify-center rounded-[6px] bg-primary text-on-primary">
          <Upload class="size-5" />
        </span>
        <span>
          <span class="block text-[17px] font-semibold text-ink">{{ dragActive ? $t('upload.drop') : $t('upload.browse') }}</span>
          <span class="mt-1 block text-[14px] text-ink-2">{{ $t('upload.formats') }}</span>
        </span>
        <span class="flex gap-1.5">
          <span v-for="t in ['PDF', 'DOCX', 'CSV', 'TXT']" :key="t" class="rounded-[4px] border border-line px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-2">{{ t }}</span>
        </span>
      </label>

      <div v-if="uploading" class="flex flex-col gap-2" role="status">
        <div class="flex justify-between font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">
          <span>{{ $t('upload.uploading') }}</span><span class="tabular">{{ progress }}%</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-line">
          <div class="h-full rounded-full bg-primary transition-[width] duration-200" :style="{ width: `${progress}%` }" />
        </div>
      </div>

      <p v-if="error" class="flex items-start gap-2 rounded-pass border border-danger bg-danger-soft px-4 py-3 text-[14px] text-danger" role="alert">
        <CircleAlert class="mt-0.5 size-4 shrink-0" />{{ error }}
      </p>
    </template>
  </div>
</template>
