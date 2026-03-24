<script setup lang="ts">
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
      aria-label="切换播放模式"
      @click="emit('cycleMode')"
    >
      {{ modeLabel }}
    </button>
    <div class="playback-controls__transport">
      <button
        class="playback-controls__button"
        data-testid="player-dock-prev"
        type="button"
        aria-label="上一首"
        @click="emit('previous')"
      >
        上一首
      </button>
      <button
        class="playback-controls__button playback-controls__button--primary"
        data-testid="player-dock-toggle"
        type="button"
        :aria-label="isPlaying ? '暂停' : '播放'"
        @click="emit('toggle')"
      >
        {{ isPlaying ? "暂停" : "播放" }}
      </button>
      <button
        class="playback-controls__button"
        data-testid="player-dock-next"
        type="button"
        aria-label="下一首"
        @click="emit('next')"
      >
        下一首
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
.playback-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.playback-controls__mode {
  min-width: 82px;
  height: 30px;
  border: 1px solid rgba(126, 147, 172, 0.35);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  color: var(--color-text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}

.playback-controls__mode:hover {
  border-color: rgba(99, 129, 164, 0.48);
  background: rgba(255, 255, 255, 0.7);
}

.playback-controls__transport {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.playback-controls__button {
  min-width: 62px;
  height: 34px;
  border: 1px solid rgba(121, 144, 169, 0.33);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: transform 120ms ease, background-color 120ms ease, border-color 120ms ease;
}

.playback-controls__button:hover {
  border-color: rgba(98, 126, 161, 0.46);
  background: rgba(255, 255, 255, 0.72);
}

.playback-controls__button:active {
  transform: translateY(1px);
}

.playback-controls__button--primary {
  min-width: 76px;
  height: 40px;
  border: 1px solid rgba(110, 133, 160, 0.54);
  background:
    linear-gradient(165deg, rgba(255, 255, 255, 0.96) 0%, rgba(239, 246, 255, 0.88) 100%),
    rgba(255, 255, 255, 0.74);
  color: #24374e;
  font-weight: 600;
  box-shadow:
    0 6px 14px rgba(30, 41, 59, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    inset 0 -2px 4px rgba(112, 130, 152, 0.18);
}

.playback-controls__button--primary:hover {
  border-color: rgba(86, 110, 139, 0.64);
  background:
    linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(232, 241, 252, 0.92) 100%),
    rgba(255, 255, 255, 0.8);
}
</style>
