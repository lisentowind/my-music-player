<script setup lang="ts">
import { computed } from "vue";
import IconButton from "@/components/ui/IconButton.vue";

const props = defineProps<{
  volume: number;
  muted: boolean;
}>();

const emit = defineEmits<{
  setVolume: [volume: number];
  toggleMute: [];
}>();

const volumePercent = computed(() => `${Math.round(props.volume * 100)}%`);
const volumeLabel = computed(() => props.muted ? "已静音" : volumePercent.value);
const volumeIcon = computed(() => {
  if (props.muted || props.volume <= 0) {
    return "solar:volume-cross-line-duotone";
  }

  if (props.volume < 0.45) {
    return "solar:volume-small-line-duotone";
  }

  return "solar:volume-loud-line-duotone";
});

function onVolumeChange(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target) {
    return;
  }

  emit("setVolume", Number.parseFloat(target.value));
}
</script>

<template>
  <section class="volume-control" :data-muted="muted ? 'true' : 'false'" aria-label="音量控制">
    <IconButton
      class="volume-control__mute"
      data-testid="player-dock-mute"
      :label="muted ? '取消静音' : '静音'"
      :icon="volumeIcon"
      :active="muted"
      :pressed="muted"
      @click="emit('toggleMute')"
    />
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
    <span class="volume-control__label">{{ volumeLabel }}</span>
  </section>
</template>

<style scoped lang="less">
.volume-control {
  display: grid;
  grid-template-columns: 34px minmax(96px, 1fr) 54px;
  align-items: center;
  gap: var(--space-2);
}

.volume-control__mute {
  border-radius: 999px;
}

.volume-control__slider {
  height: 8px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 999px;
  background:
    linear-gradient(
      90deg,
      var(--color-range-fill) 0%,
      color-mix(in srgb, var(--color-accent) 80%, white) var(--volume-progress),
      color-mix(in srgb, var(--color-surface-strong) 86%, transparent) var(--volume-progress),
      color-mix(in srgb, var(--color-surface-strong) 68%, transparent) 100%
    ),
    var(--color-surface-strong);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 32%, transparent),
    inset 0 -1px 0 color-mix(in srgb, black 8%, transparent);
  transition: border-color 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
}

.volume-control__slider:hover,
.volume-control__slider:focus-visible {
  border-color: var(--color-state-border-emphasis);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 38%, transparent),
    0 0 0 3px color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.volume-control__slider::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  border: 1px solid var(--color-range-thumb-border);
  background: var(--color-range-thumb-bg);
  box-shadow: var(--shadow-range-thumb);
}

.volume-control__slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 1px solid var(--color-range-thumb-border);
  background: var(--color-range-thumb-bg);
  box-shadow: var(--shadow-range-thumb);
}

.volume-control__label {
  color: var(--color-text-tertiary);
  font-size: 11px;
  text-align: right;
}

.volume-control[data-muted="true"] .volume-control__label {
  color: var(--color-accent);
}
</style>
