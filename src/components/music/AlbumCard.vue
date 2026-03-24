<script setup lang="ts">
import type { FeaturedAlbum } from "@/types/music";

const props = withDefaults(
  defineProps<{
    album: FeaturedAlbum;
    active?: boolean;
  }>(),
  {
    active: false,
  },
);

const emit = defineEmits<{
  play: [albumId: string];
}>();

function playAlbum() {
  emit("play", props.album.id);
}
</script>

<template>
  <article class="album-card glass-surface" :data-active="active ? 'true' : 'false'">
    <img class="album-card__cover" :src="album.coverSrc" :alt="`${album.title} 封面`">
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
    <button type="button" class="ui-button album-card__action" @click="playAlbum">
      播放专辑
    </button>
  </article>
</template>

<style scoped lang="less">
.album-card {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.album-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.album-card[data-active="true"] {
  border-color: rgba(95, 127, 155, 0.42);
}

.album-card__cover {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(143, 162, 185, 0.3);
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

.album-card__action {
  justify-self: start;
}
</style>
