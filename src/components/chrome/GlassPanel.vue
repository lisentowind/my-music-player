<script setup lang="ts">
withDefaults(
  defineProps<{
    tag?: string;
  }>(),
  {
    tag: "div",
  },
);
</script>

<template>
  <component :is="tag" class="glass-panel">
    <slot />
  </component>
</template>

<style scoped lang="less">
.glass-panel {
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: var(--radius-md);
  background:
    linear-gradient(140deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.55)),
    rgba(255, 255, 255, 0.34);
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}
</style>
