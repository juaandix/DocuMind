<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LOCALES, setLocale } from '@/i18n'

withDefaults(defineProps<{ onInk?: boolean }>(), { onInk: false })
const { locale } = useI18n()
</script>

<template>
  <span role="group" :aria-label="$t('nav.language')"
    :class="['inline-flex rounded-[5px] border', onInk ? 'border-rail-2' : 'border-line']">
    <button v-for="l in LOCALES" :key="l.code" type="button" :aria-pressed="locale === l.code" :title="l.label" :lang="l.code"
      :class="['press px-2 py-1 font-mono text-[12px] font-semibold uppercase first:rounded-l-[4px] last:rounded-r-[4px]',
        locale === l.code
          ? (onInk ? 'bg-rail-ink text-rail' : 'bg-primary text-on-primary')
          : (onInk ? 'text-rail-ink-2 hover:text-white' : 'text-ink-2 hover:text-ink')]"
      @click="setLocale(l.code)">{{ l.code }}</button>
  </span>
</template>
