<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { iconRegistry } from "@/components/ui/icon-registry";

const props = defineProps<{
  volume: number;
  muted: boolean;
  showLabel?: boolean;
}>();

const emit = defineEmits<{
  setVolume: [volume: number];
  toggleMute: [];
}>();

const volumePercent = computed(() => `${Math.round(props.volume * 100)}%`);
const volumeIcon = computed(() => props.muted
  ? iconRegistry["solar:volume-cross-outline"]
  : iconRegistry["solar:volume-loud-outline"]);

function onVolumeChange(event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target) {
    return;
  }

  emit("setVolume", Number.parseFloat(target.value));
}
</script>

<template>
  <section class="volume-control" :class="{ 'volume-control--label-hidden': showLabel === false }" aria-label="音量控制">
    <button
      class="volume-control__mute"
      data-testid="player-dock-mute"
      type="button"
      :aria-label="muted ? '取消静音' : '静音'"
      :aria-pressed="muted ? 'true' : 'false'"
      @click="emit('toggleMute')"
    >
      <Icon :icon="volumeIcon" />
    </button>
    <div class="volume-control__rail" data-testid="player-dock-volume-rail">
      <input
        class="volume-control__slider"
        data-testid="player-dock-volume"
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="volume"
        :style="{ '--volume-progress': volumePercent }"
        aria-label="调节音量"
        @input="onVolumeChange"
      >
    </div>
    <span v-if="showLabel !== false" class="volume-control__label">{{ muted ? "已静音" : volumePercent }}</span>
  </section>
</template>

<style scoped lang="less">
.volume-control {
  display: grid;
  grid-template-columns: 42px minmax(120px, 1fr) 48px;
  align-items: center;
  gap: var(--space-2);
}

.volume-control--label-hidden {
  grid-template-columns: 42px minmax(120px, 1fr);
}

.volume-control__mute {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 14px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 76%, transparent), transparent 100%),
    color-mix(in srgb, var(--color-control-surface) 92%, transparent);
  color: var(--color-text);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.volume-control__mute:hover {
  border-color: var(--color-state-border-emphasis);
  background: color-mix(in srgb, var(--color-control-surface-strong) 92%, transparent);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.volume-control__mute :deep(svg) {
  width: 18px;
  height: 18px;
}

.volume-control__rail {
  display: flex;
  align-items: center;
  min-height: 32px;
}

.volume-control__slider {
  height: 6px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 999px;
  background:
    linear-gradient(90deg, var(--color-accent-soft) 0%, var(--color-accent) var(--volume-progress), var(--color-state-hover) var(--volume-progress), transparent 100%),
    var(--color-surface);
}

.volume-control__slider::-webkit-slider-thumb {
  width: 12px;
  height: 12px;
  border: 1px solid var(--color-range-thumb-border);
  background: var(--color-range-thumb-bg);
}

.volume-control__slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border: 1px solid var(--color-range-thumb-border);
  background: var(--color-range-thumb-bg);
}

.volume-control__label {
  color: var(--color-text-tertiary);
  font-size: 11px;
  text-align: right;
}
</style>
