<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  volume: number;
  muted: boolean;
}>();

const emit = defineEmits<{
  setVolume: [volume: number];
  toggleMute: [];
}>();

const volumePercent = computed(() => `${Math.round(props.volume * 100)}%`);

function onVolumeChange(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target) {
    return;
  }

  emit("setVolume", Number.parseFloat(target.value));
}
</script>

<template>
  <section class="volume-control" aria-label="音量控制">
    <button
      class="volume-control__mute"
      data-testid="player-dock-mute"
      type="button"
      :aria-label="muted ? '取消静音' : '静音'"
      @click="emit('toggleMute')"
    >
      {{ muted ? "取消静音" : "静音" }}
    </button>
    <input
      class="volume-control__slider"
      data-testid="player-dock-volume"
      type="range"
      min="0"
      max="1"
      step="0.01"
      :value="volume"
      :style="{ '--volume-progress': volumePercent }"
      aria-label="音量"
      @input="onVolumeChange"
    >
    <span class="volume-control__label">{{ muted ? "已静音" : volumePercent }}</span>
  </section>
</template>

<style scoped lang="less">
.volume-control {
  display: grid;
  grid-template-columns: 58px minmax(90px, 1fr) 48px;
  align-items: center;
  gap: var(--space-2);
}

.volume-control__mute {
  height: 30px;
  border: 1px solid rgba(126, 147, 172, 0.35);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.56);
  color: var(--color-text-secondary);
  font-size: 11px;
  cursor: pointer;
}

.volume-control__mute:hover {
  border-color: rgba(99, 129, 164, 0.48);
  background: rgba(255, 255, 255, 0.7);
}

.volume-control__slider {
  height: 6px;
  border: 1px solid rgba(125, 142, 164, 0.26);
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(109, 170, 248, 0.66) 0%, rgba(90, 146, 239, 0.74) var(--volume-progress), rgba(255, 255, 255, 0.42) var(--volume-progress), rgba(255, 255, 255, 0.28) 100%),
    rgba(255, 255, 255, 0.45);
}

.volume-control__slider::-webkit-slider-thumb {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(118, 142, 172, 0.48);
  background: #f8fbff;
}

.volume-control__slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(118, 142, 172, 0.48);
  background: #f8fbff;
}

.volume-control__label {
  color: var(--color-text-tertiary);
  font-size: 11px;
  text-align: right;
}
</style>
