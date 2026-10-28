<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const tabs = [
  { to: '/settings/workspace', label: 'Workspace' },
  { to: '/settings/members', label: 'Members' },
  { to: '/settings/profile', label: 'Profile' },
]
</script>

<template>
  <nav aria-label="Settings" class="flex gap-6 border-b border-line">
    <router-link v-for="t in tabs" :key="t.to" :to="t.to"
      :aria-current="route.path === t.to ? 'page' : undefined"
      :class="[
        '-mb-px border-b-2 pb-2.5 text-[14px]',
        route.path === t.to ? 'border-line-strong font-semibold text-ink' : 'border-transparent font-medium text-ink-2 hover:text-ink',
      ]">{{ t.label }}</router-link>
  </nav>
</template>
