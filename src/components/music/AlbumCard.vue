<script setup lang="ts">
import { ref } from "vue";
import UiIconButton from "@/components/ui/UiIconButton.vue";
import { useGsapPointerTilt } from "@/composables/use-gsap";

interface AlbumCardData {
  id: string;
  title: string;
  artist: string;
  coverSrc: string;
  subtitle: string;
  description: string;
}

const props = withDefaults(
  defineProps<{
    album: AlbumCardData;
    active?: boolean;
  }>(),
  {
    active: false,
  },
);

const emit = defineEmits<{
  play: [albumId: string];
}>();
const cardRef = ref<HTMLElement | null>(null);

useGsapPointerTilt(cardRef, {
  maxRotateX: 7,
  maxRotateY: 9,
  liftY: -6,
  scale: 1.01,
  depthSelector: [".album-card__cover-wrap", ".album-card__meta", ".album-card__action"],
  depthOffset: 10,
});

function playAlbum() {
  emit("play", props.album.id);
}
</script>

<template>
  <article ref="cardRef" class="album-card glass-surface" :data-active="active ? 'true' : 'false'">
    <div class="album-card__cover-wrap">
      <img class="album-card__cover" :src="album.coverSrc" :alt="`${album.title} 封面`">
      <div class="album-card__cover-glow" aria-hidden="true" />
    </div>
    <div class="album-card__meta">
      <p class="album-card__subtitle">
        {{ album.subtitle }}
      </p>
      <h3 class="album-card__title">
        {{ album.title }}
      </h3>
      <p class="album-card__artist">
        {{ album.artist }}
      </p>
      <p class="album-card__description">
        {{ album.description }}
      </p>
    </div>
    <div class="album-card__footer">
      <div class="album-card__indicator">
        <span class="album-card__indicator-dot" aria-hidden="true" />
        <span>{{ active ? "播放中" : "整张加入" }}</span>
      </div>
      <UiIconButton
        class="album-card__action"
        :icon="active ? 'solar:pause-bold' : 'solar:play-bold'"
        :label="active ? `暂停 ${album.title}` : `播放 ${album.title}`"
        :pressed="active"
        variant="solid"
        size="md"
        @click.stop="playAlbum"
      />
    </div>
  </article>
</template>

<style scoped lang="less">
.album-card {
  position: relative;
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  overflow: hidden;
  transform-style: preserve-3d;
}

.album-card[data-active="true"] {
  border-color: var(--color-state-border-emphasis);
  box-shadow:
    0 18px 40px color-mix(in srgb, var(--color-accent) 16%, transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.album-card__cover-wrap {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-sm);
}

.album-card__cover-glow {
  position: absolute;
  inset: auto 0 0;
  height: 46%;
  background: linear-gradient(180deg, transparent, rgba(5, 10, 18, 0.28));
  pointer-events: none;
}

.album-card__cover {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-state-border-subtle);
}

.album-card__meta {
  min-width: 0;
}

.album-card__subtitle {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.album-card__title {
  margin: var(--space-2) 0 0;
  color: var(--color-text);
  font-size: 18px;
}

.album-card__artist {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.album-card__description {
  margin: var(--space-3) 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.album-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.album-card__indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.album-card__indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-accent);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--color-accent) 14%, transparent);
}

.album-card__action {
  flex-shrink: 0;
}
</style>
