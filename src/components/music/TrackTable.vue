<script setup lang="ts">
import { computed } from "vue";
import IconButton from "@/components/ui/IconButton.vue";

interface TrackTableRow {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationLabel: string;
}

const props = withDefaults(
  defineProps<{
    tracks: TrackTableRow[];
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
          <th scope="col" class="track-table__play-col">
            播放
          </th>
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
        >
          <td class="track-table__play">
            <IconButton
              :data-testid="`track-play-${track.id}`"
              class="track-table__action-button"
              :label="`播放 ${track.title}`"
              icon="solar:play-line-duotone"
              @click="playTrack(track.id)"
            />
          </td>
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
            <IconButton
              :data-testid="`track-like-${track.id}`"
              class="track-table__action-button"
              :label="isLiked(track.id) ? `取消喜欢 ${track.title}` : `喜欢 ${track.title}`"
              :icon="isLiked(track.id) ? 'solar:heart-bold' : 'solar:heart-line-duotone'"
              :active="isLiked(track.id)"
              :pressed="isLiked(track.id)"
              @click.stop="toggleLike(track.id)"
            />
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
  transition: background-color 120ms ease;
}

tbody tr:hover {
  background-color: var(--color-state-hover);
}

tbody tr[data-active="true"] {
  background-color: var(--color-state-selected);
}

td {
  padding: var(--space-3);
  border-top: 1px solid var(--color-state-border-subtle);
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

.track-table__play-col,
.track-table__play {
  width: 86px;
}

.track-table__action-button {
  margin-left: auto;
}
</style>
