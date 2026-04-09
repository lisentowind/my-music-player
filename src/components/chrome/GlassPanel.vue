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
  border: 1px solid var(--color-panel-border);
  border-radius: var(--radius-md);
  background:
    linear-gradient(140deg, var(--color-panel-glow-start), var(--color-panel-glow-end)),
    var(--color-panel-fill);
  backdrop-filter: blur(14px);
  box-shadow: var(--shadow-md);
}
</style>
