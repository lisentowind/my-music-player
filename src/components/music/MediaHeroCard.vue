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
    <div class="media-hero-card__image-wrap">
      <img class="media-hero-card__image" :src="coverSrc" :alt="`${title} 封面`">
      <div class="media-hero-card__shade" aria-hidden="true" />
    </div>

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
  </article>
</template>

<style scoped lang="less">
.media-hero-card {
  position: relative;
  min-height: 420px;
  border-radius: var(--radius-md);
  overflow: hidden;
  isolation: isolate;
}

.media-hero-card__image-wrap,
.media-hero-card__image,
.media-hero-card__shade {
  position: absolute;
  inset: 0;
}

.media-hero-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.02);
  filter: saturate(1.06) contrast(1.04);
}

.media-hero-card__shade {
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.56) 42%, rgba(0, 0, 0, 0.18) 100%),
    linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.62) 100%);
}

.media-hero-card__copy {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: end;
  gap: 0;
  min-height: 420px;
  max-width: 760px;
  padding: 36px 36px 34px;
}

.media-hero-card__eyebrow {
  width: fit-content;
  margin: 0 0 12px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(204, 151, 255, 0.18);
  color: var(--color-accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  backdrop-filter: blur(12px);
}

.media-hero-card__title {
  margin: 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: clamp(50px, 5vw, 76px);
  line-height: 0.92;
  letter-spacing: -0.05em;
}

.media-hero-card__description {
  max-width: 560px;
  margin: 16px 0 0;
  color: var(--color-text-contrast-muted);
  font-size: 16px;
  line-height: 1.65;
}

.media-hero-card__meta {
  margin: 16px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.media-hero-card__actions {
  margin-top: 24px;
}

.media-hero-card__actions :deep(svg) {
  width: 16px;
  height: 16px;
}
</style>
