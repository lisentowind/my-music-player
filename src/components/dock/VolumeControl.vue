<script setup lang="ts">
import { computed } from "vue";
import UiIconButton from "@/components/ui/UiIconButton.vue";

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
    <UiIconButton
      class="volume-control__mute"
      data-testid="player-dock-mute"
      :icon="muted ? 'solar:volume-cross-outline' : 'solar:volume-loud-outline'"
      :label="muted ? '取消静音' : '静音'"
      size="sm"
      variant="ghost"
      :pressed="muted"
      @click="emit('toggleMute')"
    />
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
        aria-label="音量"
        @input="onVolumeChange"
      >
    </div>
    <span class="volume-control__label">{{ muted ? "已静音" : volumePercent }}</span>
  </section>
</template>

<style scoped lang="less">
.volume-control {
  display: grid;
  grid-template-columns: 34px minmax(90px, 1fr) 48px;
  align-items: center;
  gap: var(--space-2);
}

.volume-control__mute {
  border-radius: 999px;
}

.volume-control__rail {
  display: flex;
  align-items: center;
  min-height: 28px;
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
