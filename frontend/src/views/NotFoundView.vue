<script setup lang="ts">
import BrandMark from '@/components/ui/BrandMark.vue'
import UiButton from '@/components/ui/UiButton.vue'
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-ground">
    <header class="flex h-14 items-center bg-rail px-4 sm:px-8">
      <router-link to="/dashboard" class="flex items-center gap-2.5">
        <BrandMark :size="28" />
        <span class="font-display text-[20px] font-bold uppercase leading-none tracking-[0.06em] text-white">DocuMind</span>
      </router-link>
    </header>
    <main class="flex flex-1 items-center justify-center px-4 py-16">
      <div class="grid w-full max-w-lg grid-cols-[1fr_120px] rounded-pass bg-surface shadow-pass">
        <div class="flex flex-col gap-2 p-6">
          <p class="label">Status</p>
          <h1 class="text-[24px] font-semibold tracking-[-0.015em] text-ink">Page not found</h1>
          <p class="text-[14px] text-ink-2">The page you're looking for doesn't exist or has been moved.</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <UiButton to="/dashboard">Dashboard</UiButton>
            <UiButton variant="secondary" @click="router.back()">Go back</UiButton>
          </div>
        </div>
        <div class="flex flex-col items-center justify-center border-l border-dashed border-line">
          <p class="font-display text-[48px] font-semibold leading-none text-ink">404</p>
        </div>
      </div>
    </main>
  </div>
</template>
