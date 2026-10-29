<script setup lang="ts">
import { computed } from 'vue'
import type { DocumentStatus } from '@/types/document'

// State is carried by form as well as colour: solid = ready, dashed = in
// progress, filled red = error, filled yellow = changed since you last looked.
const props = defineProps<{ status: DocumentStatus; changed?: boolean }>()

const classes = computed(() => {
  if (props.changed) return 'bg-alert text-on-alert border-alert'
  switch (props.status) {
    case 'READY': return 'border-line-strong text-ink'
    case 'ERROR': return 'bg-danger-soft text-danger border-danger'
    default: return 'border-dashed border-ink-3 text-ink-2'
  }
})
</script>

<template>
  <span :class="['inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap', classes]">
    <template v-if="changed">{{ status === 'ERROR' ? $t('status.nowFailed') : status === 'READY' ? $t('status.nowReady') : $t(`status.${status}`) }}</template>
    <template v-else>{{ $t(`status.${status}`) }}</template>
  </span>
</template>
