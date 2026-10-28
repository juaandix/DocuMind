<script setup lang="ts">
import { computed } from 'vue'

// One citation as a segmented pass: where it comes from on the left,
// its S-number and match score on the perforated stub.
const props = defineProps<{
  index: number
  documentName: string
  page?: number | null
  score: number
  excerpt: string
  active?: boolean
}>()

const match = computed(() => (props.score <= 1 ? props.score : props.score / 100).toFixed(2))
</script>

<template>
  <article :class="['grid grid-cols-[1fr_auto] rounded-pass bg-surface shadow-pass transition-shadow duration-200',
    active ? 'ring-2 ring-alert' : '']">
    <div class="flex min-w-0 flex-col gap-2 px-4 py-3">
      <div class="flex gap-5">
        <div class="min-w-0">
          <p class="label">{{ $t('common.document') }}</p>
          <p class="truncate text-[14px] font-semibold text-ink" :title="documentName">{{ documentName }}</p>
        </div>
        <div v-if="page">
          <p class="label">{{ $t('common.page') }}</p>
          <p class="font-mono text-[13px] font-semibold text-ink">{{ page }}</p>
        </div>
      </div>
      <p class="line-clamp-4 text-[14px] leading-relaxed text-ink-2">{{ excerpt }}</p>
    </div>
    <div class="flex w-28 flex-col justify-between border-l border-dashed border-line px-3 py-3">
      <p class="label">{{ $t('common.source') }}</p>
      <p class="font-display text-[34px] font-semibold leading-none text-ink">S{{ index }}</p>
      <p><span class="label block">{{ $t('common.matchLabel') }}</span><span class="font-mono text-[13px] font-semibold text-ink">{{ match }}</span></p>
    </div>
  </article>
</template>
