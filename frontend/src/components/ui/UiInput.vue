<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  label: string
  type?: string
  placeholder?: string
  autocomplete?: string
  required?: boolean
  error?: string
  hint?: string
}>(), { type: 'text' })

const model = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="label">{{ label }}</label>
    <input :id="id" v-model="model" :type="type" :placeholder="placeholder" :autocomplete="autocomplete"
      :required="required" :aria-invalid="!!error" :aria-describedby="error || hint ? `${id}-msg` : undefined"
      :class="[
        'min-h-11 w-full rounded-[5px] border bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3',
        'focus:outline-none focus:border-line-strong focus:ring-2 focus:ring-alert',
        error ? 'border-danger' : 'border-line',
      ]" />
    <p v-if="error || hint" :id="`${id}-msg`" :class="['text-[13px]', error ? 'text-danger' : 'text-ink-3']">{{ error || hint }}</p>
  </div>
</template>
