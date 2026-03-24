<script setup lang="ts">
import { computed, ref } from "vue";

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

const isDragging = ref(false);
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

function startDrag() {
  isDragging.value = true;
}

function stopDrag() {
  isDragging.value = false;
}

function seek(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target) {
    return;
  }

  emit("seek", Number.parseFloat(target.value));
}
</script>

<template>
  <section
    class="playback-progress"
    :data-disabled="safeDuration <= 0 ? 'true' : 'false'"
    :data-dragging="isDragging ? 'true' : 'false'"
    aria-label="播放进度"
  >
    <span class="playback-progress__time" data-testid="player-dock-current-time">{{ resolvedCurrentLabel }}</span>
    <div class="playback-progress__rail" :style="{ '--playback-progress': progressPercent }">
      <input
        data-testid="player-dock-progress"
        class="playback-progress__slider"
        type="range"
        min="0"
        :max="maxValue"
        step="0.1"
        :value="safeCurrentTime"
        :disabled="safeDuration <= 0"
        aria-label="播放进度"
        :aria-valuemin="0"
        :aria-valuemax="maxValue"
        :aria-valuenow="safeCurrentTime"
        :aria-valuetext="`${resolvedCurrentLabel} / ${resolvedDurationLabel}`"
        @pointerdown="startDrag"
        @pointerup="stopDrag"
        @pointercancel="stopDrag"
        @change="stopDrag"
        @blur="stopDrag"
        @input="seek"
      >
    </div>
    <span class="playback-progress__time">{{ resolvedDurationLabel }}</span>
  </section>
</template>

<style scoped lang="less">
.playback-progress {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  align-items: center;
  gap: var(--space-3);
}

.playback-progress__time {
  color: var(--color-text-tertiary);
  font-size: 11px;
  text-align: center;
}

.playback-progress__rail {
  position: relative;
}

.playback-progress__rail::before {
  content: "";
  position: absolute;
  inset: 50% 0 auto;
  height: 8px;
  border-radius: 999px;
  transform: translateY(-50%);
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--color-accent) 22%, transparent) 0%,
      color-mix(in srgb, var(--color-accent) 42%, transparent) var(--playback-progress, 0%),
      transparent 100%
    );
  filter: blur(8px);
  opacity: 0.82;
  pointer-events: none;
}

.playback-progress__slider {
  position: relative;
  z-index: 1;
  height: 8px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 999px;
  background:
    linear-gradient(
      90deg,
      var(--color-range-fill) 0%,
      color-mix(in srgb, var(--color-accent) 82%, white) var(--playback-progress),
      color-mix(in srgb, var(--color-surface-strong) 88%, transparent) var(--playback-progress),
      color-mix(in srgb, var(--color-surface-strong) 72%, transparent) 100%
    ),
    var(--color-surface-strong);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 34%, transparent),
    inset 0 -1px 0 color-mix(in srgb, black 8%, transparent);
  transition: border-color 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
}

.playback-progress__slider:hover,
.playback-progress__slider:focus-visible {
  border-color: var(--color-state-border-emphasis);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 38%, transparent),
    0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.playback-progress__slider:disabled {
  opacity: 0.42;
  cursor: default;
}

.playback-progress__slider::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  border: 1px solid var(--color-range-thumb-border);
  background: var(--color-range-thumb-bg);
  box-shadow: var(--shadow-range-thumb);
  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
}

.playback-progress__slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 1px solid var(--color-range-thumb-border);
  background: var(--color-range-thumb-bg);
  box-shadow: var(--shadow-range-thumb);
  transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
}

.playback-progress__slider:hover::-webkit-slider-thumb,
.playback-progress__slider:focus-visible::-webkit-slider-thumb,
.playback-progress[data-dragging="true"] .playback-progress__slider::-webkit-slider-thumb {
  transform: scale(1.08);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--color-accent) 18%, transparent),
    var(--shadow-range-thumb);
}

.playback-progress__slider:hover::-moz-range-thumb,
.playback-progress__slider:focus-visible::-moz-range-thumb,
.playback-progress[data-dragging="true"] .playback-progress__slider::-moz-range-thumb {
  transform: scale(1.08);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--color-accent) 18%, transparent),
    var(--shadow-range-thumb);
}

.playback-progress[data-disabled="true"] .playback-progress__time {
  color: color-mix(in srgb, var(--color-text-tertiary) 72%, transparent);
}
</style>
