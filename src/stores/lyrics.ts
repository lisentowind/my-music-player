import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { createLiricleAdapter, type LyricLine } from "@/lib/lyrics/liricle-adapter";

type LyricsStatus = "idle" | "loading" | "ready" | "empty" | "error";

export const useLyricsStore = defineStore("lyrics", () => {
  const adapter = createLiricleAdapter();
  const currentTrackId = ref<string | null>(null);
  const lines = ref<LyricLine[]>([]);
  const activeLineIndex = ref(-1);
  const status = ref<LyricsStatus>("idle");
  const offsetMs = ref(0);
  const errorMessage = ref("");

  const activeLine = computed(() => lines.value[activeLineIndex.value] ?? null);
  const isEmpty = computed(() => status.value === "empty");

  function resetState(trackId: string | null) {
    currentTrackId.value = trackId;
    lines.value = [];
    activeLineIndex.value = -1;
    errorMessage.value = "";
  }

  function loadFromText(text: string | null, trackId: string, currentTime = 0) {
    resetState(trackId);

    if (!text) {
      status.value = "empty";
      return;
    }

    status.value = "loading";
    try {
      adapter.setOffset(offsetMs.value);
      lines.value = adapter.loadFromText(text);
      status.value = lines.value.length > 0 ? "ready" : "empty";
      activeLineIndex.value = lines.value.length > 0 ? adapter.sync(currentTime) : -1;
    } catch (error) {
      status.value = "error";
      errorMessage.value = error instanceof Error ? error.message : String(error);
      lines.value = [];
      activeLineIndex.value = -1;
    }
  }

  function updateTime(time: number) {
    if (lines.value.length === 0) {
      activeLineIndex.value = -1;
      return;
    }

    activeLineIndex.value = adapter.sync(time);
  }

  function setOffset(nextOffsetMs: number) {
    offsetMs.value = Number.isFinite(nextOffsetMs) ? nextOffsetMs : 0;
    adapter.setOffset(offsetMs.value);
  }

  function clear() {
    status.value = "idle";
    resetState(null);
  }

  return {
    currentTrackId,
    lines,
    activeLineIndex,
    activeLine,
    status,
    isEmpty,
    offsetMs,
    errorMessage,
    loadFromText,
    updateTime,
    setOffset,
    clear,
  };
});
