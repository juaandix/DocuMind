<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'sm'
  to?: RouteLocationRaw
  type?: 'button' | 'submit'
  disabled?: boolean
}>(), { variant: 'primary', size: 'md', type: 'button', disabled: false })

const variants = {
  // Primary is ink; pressing it lights the alert yellow, like a gate board change.
  primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-alert active:text-on-alert',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-sunken active:bg-alert active:text-on-alert active:border-alert',
  ghost: 'text-ink-2 hover:text-ink hover:bg-sunken',
  danger: 'text-danger border border-danger hover:bg-danger hover:text-surface',
}

const classes = computed(() => [
  'press inline-flex items-center justify-center gap-2 rounded-[5px] font-semibold whitespace-nowrap select-none',
  'disabled:opacity-50 disabled:pointer-events-none',
  props.size === 'md' ? 'min-h-10 px-4 text-sm' : 'min-h-8 px-3 text-[13px]',
  variants[props.variant],
])
</script>

<template>
  <router-link v-if="to && !disabled" :to="to" :class="classes"><slot /></router-link>
  <button v-else :type="type" :disabled="disabled" :class="classes"><slot /></button>
</template>
