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

// Break opportunities after underscores so the whole name can wrap and stay identifiable.
const parts = computed(() => props.documentName.split(/(?<=_)/))
const match = computed(() => (props.score <= 1 ? props.score : props.score / 100).toFixed(2))
</script>

<template>
  <article :class="['source-pass relative grid grid-cols-[1fr_auto] rounded-pass bg-surface shadow-pass transition-shadow duration-200',
    active ? 'ring-2 ring-alert' : '']">
    <div class="flex min-w-0 flex-col gap-2 px-4 py-3">
      <div class="flex flex-col gap-1">
        <div class="flex items-baseline justify-between gap-3">
          <p class="label">{{ $t('common.document') }}</p>
          <p v-if="page" class="label">{{ $t('common.page') }} <span class="font-mono text-[13px] font-semibold text-ink">{{ page }}</span></p>
        </div>
        <p class="line-clamp-2 text-[14px] font-semibold leading-snug text-ink [overflow-wrap:anywhere]" :title="documentName">
          <template v-for="(part, i) in parts" :key="i">{{ part }}<wbr v-if="i < parts.length - 1" /></template>
        </p>
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

<style scoped>
/* Perforation notches where the stub tears off, in the colour of what sits behind. */
.source-pass::before,
.source-pass::after {
  content: '';
  position: absolute;
  right: calc(7rem - 6px);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--notch, var(--dm-ground));
}
.source-pass::before { top: -6px; }
.source-pass::after { bottom: -6px; }
</style>
