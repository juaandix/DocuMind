<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <header class="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
    <div class="min-w-0">
      <h1 class="text-[26px] font-semibold leading-tight tracking-[-0.015em] text-ink">{{ title }}</h1>
      <p v-if="description || $slots.description" class="mt-1 text-[15px] text-ink-2">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
