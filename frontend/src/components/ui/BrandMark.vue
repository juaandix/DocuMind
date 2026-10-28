<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 28 })
</script>

<template>
  <!-- A pass corner: yellow plate, ink initial, one punched notch on the stub edge. -->
  <span aria-hidden="true" class="relative inline-flex shrink-0 items-center justify-center rounded-[5px] bg-alert font-display font-bold leading-none text-on-alert"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.7)}px` }">
    D
    <span class="absolute top-1/2 -right-[3px] size-[6px] -translate-y-1/2 rounded-full bg-rail" />
  </span>
</template>
