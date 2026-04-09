<script setup lang="ts">
withDefaults(defineProps<{
  title?: string;
  description?: string;
  compact?: boolean;
  tone?: "default" | "accent" | "contrast";
}>(), {
  title: "",
  description: "",
  compact: false,
  tone: "default",
});
</script>

<template>
  <section
    class="ui-section-card glass-surface"
    :class="[`ui-section-card--${tone}`, { 'ui-section-card--compact': compact }]"
  >
    <header v-if="title || description || $slots.action" class="ui-section-card__header">
      <div class="ui-section-card__meta">
        <h2 v-if="title" class="ui-section-card__title">{{ title }}</h2>
        <p v-if="description" class="ui-section-card__description">{{ description }}</p>
      </div>
      <div v-if="$slots.action" class="ui-section-card__action">
        <slot name="action" />
      </div>
    </header>
    <div class="ui-section-card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="less">
.ui-section-card {
  position: relative;
  overflow: hidden;
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.ui-section-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 38%);
  pointer-events: none;
}

.ui-section-card--compact {
  padding: var(--space-4);
}

.ui-section-card--accent {
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.78), rgba(220, 233, 246, 0.7)),
    var(--color-surface);
  border-color: color-mix(in srgb, var(--color-accent) 24%, transparent);
}

.ui-section-card--contrast {
  background:
    linear-gradient(145deg, rgba(13, 27, 42, 0.8), rgba(28, 50, 74, 0.68)),
    var(--color-surface-contrast);
  border-color: rgba(197, 219, 241, 0.18);
  color: var(--color-text-inverse);
}

.ui-section-card--contrast .ui-section-card__title {
  color: var(--color-text-contrast);
}

.ui-section-card--contrast .ui-section-card__description {
  color: var(--color-text-contrast-muted);
}

.ui-section-card__header,
.ui-section-card__body {
  position: relative;
  z-index: 1;
}

.ui-section-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.ui-section-card__meta {
  min-width: 0;
}

.ui-section-card__title {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  color: var(--color-text);
}

.ui-section-card__description {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.ui-section-card__action {
  flex-shrink: 0;
}

.ui-section-card__body {
  min-width: 0;
}
</style>
