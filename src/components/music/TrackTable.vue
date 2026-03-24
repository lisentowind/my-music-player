<script setup lang="ts">
import { computed } from "vue";
import type { Track } from "@/types/music";

const props = withDefaults(
  defineProps<{
    tracks: Track[];
    likedIds?: string[];
    activeTrackId?: string | null;
  }>(),
  {
    likedIds: () => [],
    activeTrackId: null,
  },
);

const emit = defineEmits<{
  play: [trackId: string];
  toggleLike: [trackId: string];
}>();

const likedSet = computed(() => new Set(props.likedIds));

function isLiked(trackId: string) {
  return likedSet.value.has(trackId);
}

function playTrack(trackId: string) {
  emit("play", trackId);
}

function toggleLike(trackId: string) {
  emit("toggleLike", trackId);
}
</script>

<template>
  <section class="track-table glass-surface">
    <table>
      <thead>
        <tr>
          <th scope="col">
            歌曲
          </th>
          <th scope="col">
            专辑
          </th>
          <th scope="col">
            时长
          </th>
          <th scope="col" class="track-table__like-col">
            喜欢
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="track in tracks"
          :key="track.id"
          :data-testid="`track-row-${track.id}`"
          :data-active="track.id === activeTrackId ? 'true' : 'false'"
          @click="playTrack(track.id)"
        >
          <td>
            <p class="track-table__title">
              {{ track.title }}
            </p>
            <p class="track-table__artist">
              {{ track.artist }}
            </p>
          </td>
          <td class="track-table__album">
            {{ track.album }}
          </td>
          <td class="track-table__duration">
            {{ track.durationLabel }}
          </td>
          <td class="track-table__like">
            <button
              :data-testid="`track-like-${track.id}`"
              class="track-table__like-button"
              type="button"
              :aria-label="isLiked(track.id) ? `取消喜欢 ${track.title}` : `喜欢 ${track.title}`"
              :aria-pressed="isLiked(track.id) ? 'true' : 'false'"
              @click.stop="toggleLike(track.id)"
            >
              {{ isLiked(track.id) ? "已喜欢" : "喜欢" }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped lang="less">
.track-table {
  padding: var(--space-3);
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 560px;
}

th {
  padding: var(--space-3) var(--space-3);
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 500;
  text-align: left;
}

tbody tr {
  cursor: pointer;
  transition: background-color 120ms ease;
}

tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.48);
}

tbody tr[data-active="true"] {
  background-color: rgba(195, 216, 236, 0.32);
}

td {
  padding: var(--space-3);
  border-top: 1px solid rgba(143, 162, 185, 0.2);
  vertical-align: middle;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.track-table__title {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
}

.track-table__artist {
  margin: var(--space-1) 0 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.track-table__album,
.track-table__duration {
  white-space: nowrap;
}

.track-table__duration {
  color: var(--color-text-tertiary);
}

.track-table__like-col,
.track-table__like {
  width: 96px;
  text-align: right;
}

.track-table__like-button {
  min-width: 56px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  padding: 8px;
}

.track-table__like-button[aria-pressed="true"] {
  border-color: rgba(95, 127, 155, 0.35);
  background: rgba(95, 127, 155, 0.12);
  color: var(--color-accent-pressed);
}
</style>
