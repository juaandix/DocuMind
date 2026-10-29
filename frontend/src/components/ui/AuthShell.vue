<script setup lang="ts">
import BrandMark from '@/components/ui/BrandMark.vue'
import LocaleSwitch from '@/components/ui/LocaleSwitch.vue'
</script>

<template>
  <div class="grid min-h-dvh grid-rows-[auto_1fr] bg-ground lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-1">
    <!-- Ink side: what the product does, shown rather than told -->
    <aside class="flex flex-col justify-between gap-10 bg-rail px-6 py-6 text-rail-ink sm:px-10 lg:py-10">
      <div class="flex items-center justify-between gap-4">
        <router-link to="/login" class="flex items-center gap-2.5">
          <BrandMark :size="30" />
          <span class="font-display text-[22px] font-bold uppercase leading-none tracking-[0.06em] text-white">DocuMind</span>
        </router-link>
        <LocaleSwitch on-ink />
      </div>

      <div class="hidden max-w-md flex-col gap-6 lg:flex">
        <p class="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-white">{{ $t('auth.pitch') }}</p>
        <figure class="grid grid-cols-[1fr_92px] rounded-pass bg-surface text-ink shadow-raised" :aria-label="$t('auth.exampleLabel')">
          <div class="flex min-w-0 flex-col gap-2 px-4 py-3">
            <div class="flex gap-5">
              <div class="min-w-0"><p class="label">{{ $t('common.document') }}</p><p class="truncate text-[14px] font-semibold">Supplier_Contract.pdf</p></div>
              <div><p class="label">{{ $t('common.page') }}</p><p class="font-mono text-[13px] font-semibold">14</p></div>
            </div>
            <p class="text-[14px] leading-relaxed text-ink-2">{{ $t('auth.exampleText') }}</p>
          </div>
          <div class="flex flex-col justify-between border-l border-dashed border-line px-3 py-3">
            <p class="label">{{ $t('common.source') }}</p>
            <p class="font-display text-[34px] font-semibold leading-none">S1</p>
            <p class="font-mono text-[11px] font-semibold text-ink-3">{{ $t('common.example') }}</p>
          </div>
        </figure>
      </div>

      <p class="hidden font-mono text-[12px] text-rail-ink-2 lg:block">PDF · DOCX · CSV · TXT</p>
    </aside>

    <main class="flex items-center justify-center px-4 py-10 sm:px-8">
      <div class="w-full max-w-sm">
        <slot />
      </div>
    </main>
  </div>
</template>
