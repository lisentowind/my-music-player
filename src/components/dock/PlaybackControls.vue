<script setup lang="ts">
import UiIconButton from "@/components/ui/UiIconButton.vue";

defineProps<{
  isPlaying: boolean;
  modeLabel: string;
}>();

const emit = defineEmits<{
  previous: [];
  toggle: [];
  next: [];
  cycleMode: [];
}>();
</script>

<template>
  <div class="playback-controls">
    <button
      class="playback-controls__mode"
      data-testid="player-dock-mode"
      type="button"
      @click="emit('cycleMode')"
    >
      <UiIconButton
        class="playback-controls__mode-icon"
        icon="solar:repeat-outline"
        label="切换播放模式"
        variant="ghost"
        size="sm"
      />
      <span class="playback-controls__mode-copy">
        <span class="playback-controls__mode-caption">播放模式</span>
        <span class="playback-controls__mode-label" data-testid="player-dock-mode-label">{{ modeLabel }}</span>
      </span>
    </button>
    <div class="playback-controls__transport" data-testid="player-dock-transport">
      <UiIconButton
        class="playback-controls__button"
        data-testid="player-dock-prev"
        icon="solar:skip-previous-bold"
        label="上一首"
        size="sm"
        variant="soft"
        @click="emit('previous')"
      />
      <UiIconButton
        class="playback-controls__button playback-controls__button--primary"
        data-testid="player-dock-toggle"
        :icon="isPlaying ? 'solar:pause-bold' : 'solar:play-bold'"
        :label="isPlaying ? '暂停' : '播放'"
        variant="solid"
        size="lg"
        @click="emit('toggle')"
      />
      <UiIconButton
        class="playback-controls__button"
        data-testid="player-dock-next"
        icon="solar:skip-next-bold"
        label="下一首"
        size="sm"
        variant="soft"
        @click="emit('next')"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.playback-controls {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--space-3);
}

.playback-controls__mode {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 12px 6px 6px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.4);
  color: inherit;
  cursor: pointer;
}

.playback-controls__mode-icon {
  pointer-events: none;
}

.playback-controls__mode-copy {
  display: grid;
  text-align: left;
}

.playback-controls__mode-caption {
  color: var(--color-text-tertiary);
  font-size: 10px;
  line-height: 1.2;
}

.playback-controls__mode-label {
  color: var(--color-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

.playback-controls__transport {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 6px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
}

.playback-controls__button {
  min-width: 34px;
}

.playback-controls__button--primary {
  min-width: 52px;
}

@media (max-width: 720px) {
  .playback-controls {
    grid-template-columns: 1fr;
  }
}
</style>
