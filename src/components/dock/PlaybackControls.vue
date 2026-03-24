<script setup lang="ts">
import { computed } from "vue";
import IconButton from "@/components/ui/IconButton.vue";
import PillButton from "@/components/ui/PillButton.vue";

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

const modeIcon = computed(() => {
  const iconMap: Record<string, string> = {
    顺序播放: "solar:list-line-duotone",
    列表循环: "solar:repeat-line-duotone",
    单曲循环: "solar:repeat-one-line-duotone",
  };

  return iconMap[props.modeLabel] ?? "solar:music-library-2-line-duotone";
});
</script>

<template>
  <div class="playback-controls">
    <PillButton
      class="playback-controls__mode"
      data-testid="player-dock-mode"
      :label="modeLabel"
      :icon="modeIcon"
      :aria-label="`切换播放模式，当前 ${modeLabel}`"
      @click="emit('cycleMode')"
    />
    <div class="playback-controls__transport">
      <IconButton
        class="playback-controls__button"
        data-testid="player-dock-prev"
        label="上一首"
        icon="solar:skip-previous-bold"
        @click="emit('previous')"
      />
      <IconButton
        class="playback-controls__button playback-controls__button--primary primary-control"
        data-testid="player-dock-toggle"
        :label="isPlaying ? '暂停' : '播放'"
        :icon="isPlaying ? 'solar:pause-bold' : 'solar:play-bold'"
        :active="isPlaying"
        :pressed="isPlaying"
        @click="emit('toggle')"
      />
      <IconButton
        class="playback-controls__button"
        data-testid="player-dock-next"
        label="下一首"
        icon="solar:skip-next-bold"
        @click="emit('next')"
      />
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
  min-width: 118px;
  padding-inline: 14px;
  font-size: 11px;
  white-space: nowrap;
}

.playback-controls__transport {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.playback-controls__button {
  border-radius: 999px;
}

.playback-controls__button--primary {
  width: 46px;
  height: 46px;
  box-shadow:
    var(--shadow-primary-hover),
    inset 0 1px 0 rgba(255, 255, 255, 0.26);
}

.playback-controls__button--primary[data-active="true"] {
  color: #f8fbff;
}
</style>
