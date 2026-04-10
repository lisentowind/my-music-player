<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { iconRegistry } from "@/components/ui/icon-registry";

const props = withDefaults(defineProps<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  coverSrc?: string;
  active?: boolean;
  compact?: boolean;
  icon?: keyof typeof iconRegistry;
}>(), {
  eyebrow: "",
  subtitle: "",
  meta: "",
  coverSrc: "",
  active: false,
  compact: false,
  icon: "solar:music-notes-outline",
});

const emit = defineEmits<{
  select: [];
}>();

const resolvedIcon = computed(() => iconRegistry[props.icon]);
</script>

<template>
  <button
    type="button"
    class="media-shelf-card"
    :class="{ 'is-active': active, 'media-shelf-card--compact': compact }"
    @click="emit('select')"
  >
    <div class="media-shelf-card__visual">
      <img v-if="coverSrc" class="media-shelf-card__image" :src="coverSrc" :alt="`${title} 封面`">
      <span v-else class="media-shelf-card__icon" aria-hidden="true">
        <Icon :icon="resolvedIcon" />
      </span>
      <span class="media-shelf-card__play-chip" aria-hidden="true">
        <Icon :icon="iconRegistry['solar:play-bold']" />
      </span>
    </div>

    <div class="media-shelf-card__copy">
      <p v-if="eyebrow" class="media-shelf-card__eyebrow">{{ eyebrow }}</p>
      <h3 class="media-shelf-card__title">{{ title }}</h3>
      <p v-if="subtitle" class="media-shelf-card__subtitle">{{ subtitle }}</p>
      <p v-if="meta" class="media-shelf-card__meta">{{ meta }}</p>
    </div>
  </button>
</template>

<style scoped lang="less">
.media-shelf-card {
  width: 100%;
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 0;
  border-radius: 20px;
  background: var(--color-panel-fill);
  color: inherit;
  cursor: pointer;
  transition:
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.media-shelf-card:hover {
  background: var(--color-control-surface-strong);
  box-shadow: 0 18px 36px var(--color-popover-shadow);
  transform: translateY(-2px);
}

.media-shelf-card.is-active {
  box-shadow:
    0 22px 48px var(--color-popover-shadow),
    inset 0 0 0 1px var(--color-state-border-emphasis);
}

.media-shelf-card__visual {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-control-surface-strong);
}

.media-shelf-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 420ms ease;
}

.media-shelf-card:hover .media-shelf-card__image {
  transform: scale(1.08);
}

.media-shelf-card__icon {
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.media-shelf-card__play-chip {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--gradient-primary);
  color: var(--color-on-accent);
  box-shadow: var(--shadow-primary-active);
  transform: translateY(10px);
  opacity: 0;
  transition: opacity 220ms ease, transform 220ms ease;
}

.media-shelf-card:hover .media-shelf-card__play-chip,
.media-shelf-card.is-active .media-shelf-card__play-chip {
  transform: translateY(0);
  opacity: 1;
}

.media-shelf-card__copy {
  min-width: 0;
  text-align: left;
}

.media-shelf-card__eyebrow {
  margin: 0 0 8px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.media-shelf-card__title {
  margin: 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: 18px;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.media-shelf-card__subtitle,
.media-shelf-card__meta {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.media-shelf-card--compact {
  grid-template-columns: 64px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.media-shelf-card--compact .media-shelf-card__visual {
  aspect-ratio: 1;
  border-radius: 12px;
}

.media-shelf-card--compact .media-shelf-card__play-chip {
  width: 34px;
  height: 34px;
  right: 8px;
  bottom: 8px;
}

.media-shelf-card--compact .media-shelf-card__title {
  font-size: 16px;
}

.media-shelf-card__title,
.media-shelf-card__subtitle,
.media-shelf-card__meta {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
