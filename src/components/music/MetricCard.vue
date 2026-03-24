<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    hint?: string;
  }>(),
  {
    hint: "",
  },
);
</script>

<template>
  <article class="metric-card glass-surface">
    <p class="metric-card__label">
      {{ label }}
    </p>
    <p class="metric-card__value">
      {{ value }}
    </p>
    <p v-if="hint" class="metric-card__hint">
      {{ hint }}
    </p>
  </article>
</template>

<style scoped lang="less">
.metric-card {
  padding: var(--space-4);
  border-radius: var(--radius-md);
}

.metric-card__label {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.metric-card__value {
  margin: var(--space-2) 0 0;
  color: var(--color-text);
  font-size: 28px;
  line-height: 1.15;
  font-weight: 600;
}

.metric-card__hint {
  margin: var(--space-2) 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.4;
}
</style>
