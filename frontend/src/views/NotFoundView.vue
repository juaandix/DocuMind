<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-[#e8e8ed] flex items-center justify-center p-6">
    <div class="text-center max-w-sm">
      <div class="w-20 h-20 rounded-3xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex items-center justify-center mx-auto mb-6">
        <span class="text-4xl font-bold text-[#0071e3] leading-none">?</span>
      </div>
      <h1 class="text-2xl font-semibold text-[#1d1d1f] mb-2">Page not found</h1>
      <p class="text-sm text-[#6e6e73] mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <div class="flex justify-center gap-3">
        <button @click="router.back()"
          class="px-5 py-2.5 rounded-xl bg-white border border-black/[0.1] text-sm font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          Go back
        </button>
        <router-link to="/dashboard"
          class="px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium transition-colors shadow-[0_1px_3px_rgba(0,113,227,0.4)]">
          Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>
