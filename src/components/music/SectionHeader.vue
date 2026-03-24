<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
    eyebrow?: string;
  }>(),
  {
    description: "",
    eyebrow: "",
  },
);
</script>

<template>
  <header class="section-header">
    <div class="section-header__content">
      <p v-if="eyebrow" class="section-header__eyebrow">
        {{ eyebrow }}
      </p>
      <h2 class="section-header__title">
        {{ title }}
      </h2>
      <p v-if="description" class="section-header__description">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="section-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped lang="less">
.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.section-header__content {
  min-width: 0;
}

.section-header__eyebrow {
  margin: 0 0 var(--space-1);
  color: var(--color-text-tertiary);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-header__title {
  margin: 0;
  color: var(--color-text);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}

.section-header__description {
  margin: var(--space-2) 0 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.section-header__actions {
  flex-shrink: 0;
}
</style>
