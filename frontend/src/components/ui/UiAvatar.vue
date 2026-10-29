<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ name: string; ai?: boolean; size?: 'sm' | 'md' }>(), { size: 'md' })

const initials = computed(() =>
  props.name.split(/\s+/).filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?',
)
</script>

<template>
  <span aria-hidden="true" :class="[
    'inline-flex shrink-0 items-center justify-center rounded-[5px] font-semibold leading-none',
    size === 'md' ? 'size-8 text-[12px]' : 'size-6 text-[11px]',
    ai ? 'bg-alert font-display text-[15px] font-bold text-on-alert' : 'bg-surface font-mono text-ink shadow-pass',
  ]">{{ ai ? 'D' : initials }}</span>
</template>
