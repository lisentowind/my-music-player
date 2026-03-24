<script setup lang="ts">
import type { Track } from "@/types/music";

withDefaults(
  defineProps<{
    tracks: Track[];
    activeTrackId?: string | null;
  }>(),
  {
    activeTrackId: null,
  },
);

const emit = defineEmits<{
  play: [trackId: string];
}>();

function playTrack(trackId: string) {
  emit("play", trackId);
}
</script>

<template>
  <section class="recent-play-list glass-surface" aria-label="最近播放">
    <ul v-if="tracks.length > 0" class="recent-play-list__list">
      <li v-for="track in tracks" :key="track.id">
        <button
          type="button"
          class="recent-play-list__item"
          :data-active="track.id === activeTrackId ? 'true' : 'false'"
          @click="playTrack(track.id)"
        >
          <img class="recent-play-list__cover" :src="track.coverSrc" :alt="`${track.title} 封面`">
          <span class="recent-play-list__meta">
            <span class="recent-play-list__title">{{ track.title }}</span>
            <span class="recent-play-list__artist">{{ track.artist }}</span>
          </span>
          <span class="recent-play-list__duration">{{ track.durationLabel }}</span>
        </button>
      </li>
    </ul>
    <p v-else class="recent-play-list__empty">
      还没有最近播放记录
    </p>
  </section>
</template>

<style scoped lang="less">
.recent-play-list {
  padding: var(--space-3);
}

.recent-play-list__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.recent-play-list__item {
  width: 100%;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  padding: var(--space-2) var(--space-3);
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-3);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 120ms ease, background-color 120ms ease;
}

.recent-play-list__item:hover {
  background: rgba(255, 255, 255, 0.42);
}

.recent-play-list__item[data-active="true"] {
  border-color: rgba(95, 127, 155, 0.32);
  background: rgba(195, 216, 236, 0.26);
}

.recent-play-list__cover {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: var(--radius-xs);
  border: 1px solid rgba(143, 162, 185, 0.24);
}

.recent-play-list__meta {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.recent-play-list__title {
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-play-list__artist {
  color: var(--color-text-secondary);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-play-list__duration {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.recent-play-list__empty {
  margin: 0;
  padding: var(--space-4);
  color: var(--color-text-secondary);
  font-size: 13px;
}
</style>
