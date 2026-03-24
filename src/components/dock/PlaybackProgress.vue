<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{
  currentTime: number;
  duration: number;
  currentLabel?: string;
  durationLabel?: string;
}>(), {
  currentLabel: "",
  durationLabel: "",
});

const emit = defineEmits<{
  seek: [time: number];
}>();

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const safeDuration = computed(() => Number.isFinite(props.duration) && props.duration > 0 ? props.duration : 0);
const safeCurrentTime = computed(() => {
  if (!Number.isFinite(props.currentTime) || props.currentTime < 0) {
    return 0;
  }

  return safeDuration.value > 0
    ? Math.min(props.currentTime, safeDuration.value)
    : props.currentTime;
});
const progressPercent = computed(() => {
  if (safeDuration.value <= 0) {
    return "0%";
  }

  const progress = (safeCurrentTime.value / safeDuration.value) * 100;
  return `${Math.min(progress, 100)}%`;
});
const maxValue = computed(() => safeDuration.value > 0 ? safeDuration.value : 1);
const resolvedCurrentLabel = computed(() => props.currentLabel || formatTime(safeCurrentTime.value));
const resolvedDurationLabel = computed(() => props.durationLabel || formatTime(safeDuration.value));

function seek(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target) {
    return;
  }

  emit("seek", Number.parseFloat(target.value));
}
</script>

<template>
  <section class="playback-progress" aria-label="播放进度">
    <span class="playback-progress__time" data-testid="player-dock-current-time">{{ resolvedCurrentLabel }}</span>
    <input
      data-testid="player-dock-progress"
      class="playback-progress__slider"
      type="range"
      min="0"
      :max="maxValue"
      step="0.1"
      :value="safeCurrentTime"
      :disabled="safeDuration <= 0"
      :style="{ '--playback-progress': progressPercent }"
      aria-label="播放进度"
      @input="seek"
    >
    <span class="playback-progress__time">{{ resolvedDurationLabel }}</span>
  </section>
</template>

<style scoped lang="less">
.playback-progress {
  display: grid;
  grid-template-columns: 38px minmax(140px, 1fr) 38px;
  align-items: center;
  gap: var(--space-2);
}

.playback-progress__time {
  color: var(--color-text-tertiary);
  font-size: 11px;
  text-align: center;
}

.playback-progress__slider {
  height: 6px;
  border: 1px solid rgba(125, 142, 164, 0.26);
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(125, 168, 255, 0.72) 0%, rgba(82, 130, 240, 0.78) var(--playback-progress), rgba(255, 255, 255, 0.4) var(--playback-progress), rgba(255, 255, 255, 0.24) 100%),
    rgba(255, 255, 255, 0.5);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.62);
}

.playback-progress__slider:disabled {
  opacity: 0.65;
  cursor: default;
}

.playback-progress__slider::-webkit-slider-thumb {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(118, 142, 172, 0.48);
  background: #f8fbff;
}

.playback-progress__slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(118, 142, 172, 0.48);
  background: #f8fbff;
}
</style>
