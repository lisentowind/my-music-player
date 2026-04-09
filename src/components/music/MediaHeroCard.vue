<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { iconRegistry } from "@/components/ui/icon-registry";
import UiButton from "@/components/ui/UiButton.vue";

withDefaults(defineProps<{
  eyebrow?: string;
  title: string;
  description: string;
  coverSrc: string;
  metaLine?: string;
  secondaryLabel?: string;
  primaryTestId?: string;
  secondaryTestId?: string;
}>(), {
  eyebrow: "",
  metaLine: "",
  secondaryLabel: "",
  primaryTestId: "",
  secondaryTestId: "",
});

const emit = defineEmits<{
  primary: [];
  secondary: [];
}>();
</script>

<template>
  <article class="media-hero-card">
    <div class="media-hero-card__copy">
      <p v-if="eyebrow" class="media-hero-card__eyebrow">{{ eyebrow }}</p>
      <h1 class="media-hero-card__title">{{ title }}</h1>
      <p class="media-hero-card__description">{{ description }}</p>
      <p v-if="metaLine" class="media-hero-card__meta">{{ metaLine }}</p>
      <div class="media-hero-card__actions flex items-center gap-3">
        <UiButton
          type="button"
          size="lg"
          variant="solid"
          :data-testid="primaryTestId || undefined"
          @click="emit('primary')"
        >
          <template #leading>
            <Icon :icon="iconRegistry['solar:play-bold']" />
          </template>
          立即播放
        </UiButton>
        <UiButton
          v-if="secondaryLabel"
          type="button"
          size="lg"
          variant="ghost"
          :data-testid="secondaryTestId || undefined"
          @click="emit('secondary')"
        >
          {{ secondaryLabel }}
        </UiButton>
      </div>
    </div>

    <div class="media-hero-card__visual">
      <img class="media-hero-card__image" :src="coverSrc" :alt="`${title} 封面`">
    </div>
  </article>
</template>

<style scoped lang="less">
.media-hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 420px);
  align-items: stretch;
  gap: 24px;
  min-height: 320px;
}

.media-hero-card__copy {
  display: grid;
  align-content: center;
}

.media-hero-card__eyebrow {
  margin: 0 0 10px;
  color: var(--color-text-tertiary);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.media-hero-card__title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 54px;
  line-height: 0.96;
  letter-spacing: -0.04em;
}

.media-hero-card__description {
  max-width: 560px;
  margin: 18px 0 0;
  color: var(--color-text-secondary);
  font-size: 16px;
  line-height: 1.7;
}

.media-hero-card__meta {
  margin: 16px 0 0;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.media-hero-card__actions {
  margin-top: 24px;
}


.media-hero-card__actions :deep(svg) {
  width: 16px;
  height: 16px;
}

.media-hero-card__visual {
  position: relative;
  min-height: 100%;
  border-radius: 32px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 24%, transparent), transparent 38%),
    rgba(255, 255, 255, 0.04);
}

.media-hero-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.1) contrast(1.06);
}
</style>
