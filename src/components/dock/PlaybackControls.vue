<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { iconRegistry } from "@/components/ui/icon-registry";

const props = defineProps<{
  isPlaying: boolean;
  modeLabel: string;
}>();

const emit = defineEmits<{
  previous: [];
  toggle: [];
  next: [];
  cycleMode: [];
}>();

const toggleIcon = computed(() => props.isPlaying
  ? iconRegistry["solar:pause-bold"]
  : iconRegistry["solar:play-bold"]);
</script>

<template>
  <div class="playback-controls">
    <button
      class="playback-controls__mode"
      data-testid="player-dock-mode"
      type="button"
      :aria-label="`切换播放模式，当前${modeLabel}`"
      @click="emit('cycleMode')"
    >
      <span class="playback-controls__mode-icon" aria-hidden="true">
        <Icon :icon="iconRegistry['solar:repeat-outline']" />
      </span>
      <span class="playback-controls__mode-copy">
        <span class="playback-controls__mode-caption">播放模式</span>
        <span class="playback-controls__mode-label" data-testid="player-dock-mode-label">{{ modeLabel }}</span>
      </span>
    </button>

    <div class="playback-controls__transport" data-testid="player-dock-transport">
      <button
        class="playback-controls__button"
        data-testid="player-dock-prev"
        type="button"
        aria-label="播放上一首"
        @click="emit('previous')"
      >
        <Icon :icon="iconRegistry['solar:skip-previous-bold']" />
      </button>
      <button
        class="playback-controls__button playback-controls__button--primary"
        data-testid="player-dock-toggle"
        type="button"
        :aria-label="isPlaying ? '暂停播放' : '开始播放'"
        :aria-pressed="isPlaying ? 'true' : 'false'"
        @click="emit('toggle')"
      >
        <Icon :icon="toggleIcon" />
      </button>
      <button
        class="playback-controls__button"
        data-testid="player-dock-next"
        type="button"
        aria-label="播放下一首"
        @click="emit('next')"
      >
        <Icon :icon="iconRegistry['solar:skip-next-bold']" />
      </button>
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

.playback-controls__mode,
.playback-controls__transport,
.playback-controls__button {
  border: 1px solid var(--color-state-border-subtle);
  background: color-mix(in srgb, var(--color-control-surface) 92%, transparent);
  color: var(--color-text);
}

.playback-controls__mode {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 0 14px;
  border-radius: 18px;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.playback-controls__mode:hover,
.playback-controls__button:hover {
  border-color: var(--color-state-border-emphasis);
  background: color-mix(in srgb, var(--color-control-surface-strong) 92%, transparent);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
  transform: translateY(-1px);
}

.playback-controls__mode-icon,
.playback-controls__button {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.playback-controls__mode-icon {
  background: var(--gradient-primary);
  color: var(--color-text-contrast);
}

.playback-controls__mode-icon :deep(svg),
.playback-controls__button :deep(svg) {
  width: 18px;
  height: 18px;
}

.playback-controls__mode-copy {
  display: grid;
  gap: 4px;
  text-align: left;
}

.playback-controls__mode-caption {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.playback-controls__mode-label {
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
}

.playback-controls__transport {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 12px;
  border-radius: 18px;
}

.playback-controls__button {
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.playback-controls__button--primary {
  width: 54px;
  height: 54px;
  border-color: transparent;
  background: var(--gradient-primary);
  color: var(--color-text-contrast);
  box-shadow: var(--shadow-primary-hover);
}
</style>
