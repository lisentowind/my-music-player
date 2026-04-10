<script setup lang="ts">
import { nextTick, ref, watch, type ComponentPublicInstance } from "vue";
import type { LyricLine } from "@/lib/lyrics/liricle-adapter";

const props = withDefaults(defineProps<{
  lines: LyricLine[];
  activeLineIndex: number;
  trackId?: string | null;
  status?: "idle" | "loading" | "ready" | "empty" | "error";
  errorMessage?: string;
}>(), {
  trackId: null,
  status: "idle",
  errorMessage: "",
});

const lineRefs = ref<HTMLElement[]>([]);
const scrollRef = ref<HTMLElement | null>(null);

function setLineRef(index: number, element: Element | ComponentPublicInstance | null) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  lineRefs.value[index] = element;
}

watch([
  () => props.trackId,
  () => props.activeLineIndex,
  () => props.lines.length,
], async ([, nextIndex]) => {
  await nextTick();
  if (nextIndex < 0) {
    if (scrollRef.value) {
      scrollRef.value.scrollTop = 0;
    }
    return;
  }

  const target = lineRefs.value[nextIndex];
  target?.scrollIntoView?.({
    block: "center",
    behavior: "smooth",
  });
});
</script>

<template>
  <section class="lyrics-panel" data-testid="player-lyrics-panel" aria-label="歌词面板">
    <div v-if="status === 'error'" class="lyrics-panel__empty">
      <p class="lyrics-panel__empty-title">歌词加载失败</p>
      <p class="lyrics-panel__empty-copy">{{ errorMessage || "稍后再试一次。" }}</p>
    </div>

    <div v-else-if="status === 'empty'" class="lyrics-panel__empty" data-testid="player-lyrics-empty">
      <p class="lyrics-panel__empty-title">当前曲目暂无歌词</p>
      <p class="lyrics-panel__empty-copy">先沉浸听一会儿，等下一首也许就会出现逐行歌词。</p>
    </div>

    <div v-else-if="lines.length === 0" class="lyrics-panel__empty">
      <p class="lyrics-panel__empty-title">歌词准备中</p>
      <p class="lyrics-panel__empty-copy">播放开始后，这里会跟着进度同步滚动。</p>
    </div>

    <div v-else ref="scrollRef" class="lyrics-panel__scroll">
      <p
        v-for="(line, index) in lines"
        :key="`${line.time}-${index}`"
        :ref="element => setLineRef(index, element)"
        class="lyrics-panel__line"
        :class="{ 'is-active': index === activeLineIndex }"
        :data-testid="index === activeLineIndex ? 'player-lyrics-active-line' : undefined"
      >
        {{ line.text || "..." }}
      </p>
    </div>
  </section>
</template>

<style scoped lang="less">
.lyrics-panel {
  min-height: 420px;
  height: 100%;
}

.lyrics-panel__scroll {
  display: grid;
  gap: 20px;
  max-height: 560px;
  overflow: auto;
  padding: 10px 18px 10px 0;
}

.lyrics-panel__line {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 26px;
  font-weight: 600;
  line-height: 1.22;
  letter-spacing: -0.04em;
  transition:
    color 180ms ease,
    transform 180ms ease,
    opacity 180ms ease;
  opacity: 0.52;
}

.lyrics-panel__line.is-active {
  color: var(--color-text-strong);
  opacity: 1;
  transform: translateX(8px);
}

.lyrics-panel__empty {
  display: grid;
  align-content: center;
  min-height: 420px;
}

.lyrics-panel__empty-title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 24px;
  font-weight: 700;
}

.lyrics-panel__empty-copy {
  margin: 14px 0 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.7;
}
</style>
