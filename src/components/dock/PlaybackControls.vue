<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { iconRegistry } from "@/components/ui/icon-registry";

const props = defineProps<{
  isPlaying: boolean;
  modeLabel: string;
  mode?: string;
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
const modeBadge = computed(() => {
  if (props.mode === "repeat-one") {
    return "单";
  }

  if (props.mode === "shuffle") {
    return "乱";
  }

  return "序";
});
</script>

<template>
  <div class="playback-controls">
    <button
      class="playback-controls__mode"
      data-testid="player-dock-mode"
      type="button"
      :data-mode="props.mode ?? 'sequential'"
      :aria-label="`切换播放模式，当前${modeLabel}`"
      @click="emit('cycleMode')"
    >
      <span class="playback-controls__mode-icon" aria-hidden="true">
        <Icon :icon="iconRegistry['solar:repeat-outline']" />
        <span class="playback-controls__mode-badge">{{ modeBadge }}</span>
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
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 76%, transparent), transparent 100%),
    color-mix(in srgb, var(--color-control-surface) 92%, transparent);
  color: var(--color-text);
}

.playback-controls__mode {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 12px;
  border-radius: 16px;
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
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.playback-controls__mode[data-mode="repeat-one"] .playback-controls__mode-badge,
.playback-controls__mode[data-mode="shuffle"] .playback-controls__mode-badge {
  background: color-mix(in srgb, var(--color-accent) 20%, var(--color-surface-contrast));
}

.playback-controls__mode-icon,
.playback-controls__button {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}

.playback-controls__mode-icon {
  position: relative;
  background: var(--gradient-primary);
  color: var(--color-text-contrast);
}

.playback-controls__mode-badge {
  position: absolute;
  right: -2px;
  bottom: -2px;
  min-width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 1px solid color-mix(in srgb, var(--color-surface-contrast) 72%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-surface-contrast) 92%, transparent);
  color: var(--color-accent);
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
}

.playback-controls__mode-icon :deep(svg),
.playback-controls__button :deep(svg) {
  width: 17px;
  height: 17px;
}

.playback-controls__mode-copy {
  display: grid;
  gap: 4px;
  text-align: left;
}

.playback-controls__mode-caption {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.playback-controls__mode-label {
  color: var(--color-text);
  font-size: 12px;
  font-weight: 600;
}

.playback-controls__transport {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 10px;
  border-radius: 16px;
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
  width: 50px;
  height: 50px;
  border-color: transparent;
  background: var(--gradient-primary);
  color: var(--color-text-contrast);
  box-shadow: var(--shadow-primary-hover);
}
</style>
