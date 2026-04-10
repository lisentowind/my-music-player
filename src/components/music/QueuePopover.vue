<script setup lang="ts">
import type { Track } from "@/types/music";
import TrackQueueList from "@/components/music/TrackQueueList.vue";

defineProps<{
  currentTrack: Track | null;
  upcomingTracks: Track[];
  queueLength: number;
}>();

const emit = defineEmits<{
  select: [trackId: string];
  close: [];
}>();
</script>

<template>
  <section
    id="player-dock-queue-popover"
    class="queue-popover"
    data-testid="player-dock-queue-popover"
    aria-label="播放队列概览"
  >
    <div class="queue-popover__head">
      <div>
        <p class="queue-popover__eyebrow">即将播放</p>
        <h3 class="queue-popover__title">队列概览</h3>
      </div>
      <div class="queue-popover__head-side">
        <p class="queue-popover__count" data-testid="queue-total-count">总队列长度 {{ queueLength }} 首</p>
        <button
          type="button"
          class="queue-popover__close"
          aria-label="关闭队列面板"
          @click="emit('close')"
        >
          关闭
        </button>
      </div>
    </div>

    <div class="queue-popover__current">
      <span class="queue-popover__label">当前播放曲目</span>
      <button
        v-if="currentTrack"
        type="button"
        class="queue-popover__current-card"
        data-testid="queue-current-track"
        :aria-label="`当前播放 ${currentTrack.title}`"
        @click="emit('select', currentTrack.id)"
      >
        <img class="queue-popover__current-cover" :src="currentTrack.coverSrc" :alt="`${currentTrack.title} 封面`">
        <span class="queue-popover__current-copy">
          <strong>{{ currentTrack.title }}</strong>
          <span>{{ currentTrack.artist }} · {{ currentTrack.album }}</span>
        </span>
      </button>
      <p v-else class="queue-popover__empty">还没有激活的播放曲目。</p>
    </div>

    <TrackQueueList :tracks="upcomingTracks" @select="emit('select', $event)" />
  </section>
</template>

<style scoped lang="less">
.queue-popover {
  width: 360px;
  display: grid;
  gap: 18px;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 18%, var(--color-state-border-subtle));
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 20%, transparent), transparent 40%),
    linear-gradient(180deg, var(--color-popover-glow-start), var(--color-popover-glow-end)),
    var(--color-popover-fill);
  box-shadow:
    0 28px 60px var(--color-popover-shadow),
    var(--shadow-lg),
    inset 0 1px 0 var(--color-panel-glow-end);
  backdrop-filter: blur(18px);
}

.queue-popover__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.queue-popover__eyebrow {
  margin: 0 0 6px;
  color: var(--color-text-tertiary);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.queue-popover__title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 22px;
  line-height: 1.1;
}

.queue-popover__count {
  margin: 2px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  text-align: right;
}

.queue-popover__head-side {
  display: grid;
  gap: 8px;
  justify-items: end;
}

.queue-popover__close {
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 999px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 76%, transparent), transparent 100%),
    color-mix(in srgb, var(--color-control-surface) 92%, transparent);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.queue-popover__close:hover {
  transform: translateY(-1px);
  border-color: var(--color-state-border-emphasis);
  background: color-mix(in srgb, var(--color-control-surface-strong) 92%, transparent);
  box-shadow: var(--shadow-sm);
  color: var(--color-text-strong);
}

.queue-popover__current {
  display: grid;
  gap: 10px;
}

.queue-popover__label {
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
}

.queue-popover__current-card {
  width: 100%;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 22%, var(--color-state-border-subtle));
  border-radius: 20px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent),
    color-mix(in srgb, var(--color-control-surface) 92%, transparent);
  color: inherit;
  cursor: pointer;
  box-shadow: inset 0 1px 0 var(--color-panel-glow-end);
}

.queue-popover__current-cover {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  object-fit: cover;
}

.queue-popover__current-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
  text-align: left;
}

.queue-popover__current-copy strong,
.queue-popover__current-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-popover__current-copy strong {
  color: var(--color-text);
  font-size: 14px;
}

.queue-popover__current-copy span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.queue-popover__empty {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
}
</style>
