<script setup lang="ts">
import type { Track } from "@/types/music";

defineProps<{
  tracks: Track[];
}>();

const emit = defineEmits<{
  select: [trackId: string];
}>();
</script>

<template>
  <div class="track-queue-list">
    <div class="track-queue-list__head">
      <span class="track-queue-list__label">下一首列表</span>
      <span class="track-queue-list__note">只读预览，可直接点击切歌</span>
    </div>

    <ul v-if="tracks.length > 0" class="track-queue-list__items">
      <li v-for="track in tracks" :key="track.id">
        <button
          type="button"
          class="track-queue-list__item"
          :data-testid="`queue-track-item-${track.id}`"
          :aria-label="`播放 ${track.title}`"
          @click="emit('select', track.id)"
        >
          <img class="track-queue-list__cover" :src="track.coverSrc" :alt="`${track.title} 封面`">
          <span class="track-queue-list__copy">
            <span class="track-queue-list__title">{{ track.title }}</span>
            <span class="track-queue-list__meta">{{ track.artist }} · {{ track.durationLabel }}</span>
          </span>
        </button>
      </li>
    </ul>

    <p v-else class="track-queue-list__empty">当前没有更多待播内容。</p>
  </div>
</template>

<style scoped lang="less">
.track-queue-list {
  display: grid;
  gap: 12px;
}

.track-queue-list__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.track-queue-list__label {
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
}

.track-queue-list__note {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.track-queue-list__items {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.track-queue-list__item {
  width: 100%;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 18px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 76%, transparent), transparent 100%),
    color-mix(in srgb, var(--color-control-surface) 92%, transparent);
  color: inherit;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.track-queue-list__item:hover {
  border-color: var(--color-state-border-emphasis);
  background: color-mix(in srgb, var(--color-control-surface-strong) 92%, transparent);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.track-queue-list__cover {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  object-fit: cover;
}

.track-queue-list__copy {
  min-width: 0;
  display: grid;
  gap: 4px;
  text-align: left;
}

.track-queue-list__title {
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-queue-list__meta {
  color: var(--color-text-secondary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-queue-list__empty {
  margin: 0;
  padding: 14px 0 2px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}
</style>
