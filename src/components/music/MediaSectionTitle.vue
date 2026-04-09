<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow?: string;
  title: string;
  description?: string;
}>(), {
  eyebrow: "",
  description: "",
});
</script>

<template>
  <header class="media-section-title">
    <div class="media-section-title__copy">
      <p v-if="eyebrow" class="media-section-title__eyebrow">{{ eyebrow }}</p>
      <h2 class="media-section-title__title">{{ title }}</h2>
      <p v-if="description" class="media-section-title__description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="media-section-title__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped lang="less">
.media-section-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.media-section-title__copy {
  min-width: 0;
}

.media-section-title__eyebrow {
  margin: 0 0 8px;
  color: var(--color-text-tertiary);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.media-section-title__title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 28px;
  line-height: 1.08;
}

.media-section-title__description {
  margin: 10px 0 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.media-section-title__actions {
  flex-shrink: 0;
}
</style>
