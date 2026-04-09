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
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent),
    color-mix(in srgb, var(--color-control-surface) 94%, transparent);
  color: inherit;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.media-shelf-card:hover {
  border-color: var(--color-state-border-emphasis);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent),
    color-mix(in srgb, var(--color-control-surface-strong) 94%, transparent);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px);
}

.media-shelf-card.is-active {
  border-color: color-mix(in srgb, var(--color-accent) 34%, transparent);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.2);
}

.media-shelf-card--compact {
  grid-template-columns: 68px minmax(0, 1fr);
  padding: 14px;
}

.media-shelf-card__visual {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 20px;
  overflow: hidden;
  background: color-mix(in srgb, var(--color-control-surface-strong) 92%, transparent);
}

.media-shelf-card--compact .media-shelf-card__visual {
  border-radius: 18px;
}

.media-shelf-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-shelf-card__icon {
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.media-shelf-card__icon :deep(svg) {
  width: 26px;
  height: 26px;
}

.media-shelf-card__copy {
  min-width: 0;
  text-align: left;
}

.media-shelf-card__eyebrow {
  margin: 0 0 8px;
  color: var(--color-text-tertiary);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.media-shelf-card__title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 18px;
  line-height: 1.15;
}

.media-shelf-card__subtitle,
.media-shelf-card__meta {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.media-shelf-card__title,
.media-shelf-card__subtitle,
.media-shelf-card__meta {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
