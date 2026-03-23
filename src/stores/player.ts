import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { likedTrackIds, tracks } from "@/data/music-library";
import { createPlayerAudio } from "@/lib/player/audio";
import {
  resolveEndedAction,
  resolveErrorRecovery,
  resolveNextAction,
  resolvePreviousAction,
  resolveQueueSelection,
} from "@/lib/player/rules";
import type { AudioLike } from "@/lib/player/audio";
import type { PlaybackMode, Track } from "@/types/music";

interface LifecycleBridge {
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onEnded: () => void;
  onError: () => void;
}

let sharedAudio: AudioLike | null = null;
let lifecycleBound = false;
let lifecycleBridge: LifecycleBridge | null = null;

function getSharedAudio() {
  if (!sharedAudio) {
    sharedAudio = createPlayerAudio();
  }

  return sharedAudio;
}

function toSafeDuration(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return value;
}

function toSafeTime(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function clampVolume(nextVolume: number) {
  if (!Number.isFinite(nextVolume)) {
    return 0;
  }

  return Math.min(1, Math.max(0, nextVolume));
}

function toErrorMessage(audio: AudioLike, error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  const audioError = audio.error;
  if (audioError && "message" in audioError && typeof audioError.message === "string" && audioError.message) {
    return audioError.message;
  }

  return "播放失败，请稍后重试。";
}

function bindLifecycleOnce(audio: AudioLike) {
  if (lifecycleBound) {
    return;
  }

  audio.addEventListener("loadedmetadata", () => {
    lifecycleBridge?.onLoadedMetadata();
  });
  audio.addEventListener("timeupdate", () => {
    lifecycleBridge?.onTimeUpdate();
  });
  audio.addEventListener("ended", () => {
    lifecycleBridge?.onEnded();
  });
  audio.addEventListener("error", () => {
    lifecycleBridge?.onError();
  });
  lifecycleBound = true;
}

export const usePlayerStore = defineStore("player", () => {
  const queue = ref<Track[]>([...tracks]);
  const currentIndex = ref(0);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(0.72);
  const muted = ref(false);
  const mode = ref<PlaybackMode>("sequential");
  const likedIds = ref(new Set(likedTrackIds));
  const recentPlayIds = ref<string[]>([]);
  const errorMessage = ref("");
  const errorTrackId = ref<string | null>(null);
  const currentTrack = computed(() => queue.value[currentIndex.value] ?? null);

  const audio = getSharedAudio();
  audio.volume = volume.value;
  audio.muted = muted.value;

  function clampIndex(nextIndex: number) {
    if (queue.value.length <= 0) {
      return 0;
    }

    return Math.min(Math.max(nextIndex, 0), queue.value.length - 1);
  }

  function syncCurrentTimeFromAudio() {
    currentTime.value = toSafeTime(audio.currentTime);
  }

  function syncDurationFromAudio() {
    duration.value = toSafeDuration(audio.duration);
  }

  function rememberRecent(trackId: string) {
    recentPlayIds.value = [trackId, ...recentPlayIds.value.filter(id => id !== trackId)].slice(0, 20);
  }

  function clearPlaybackError() {
    errorMessage.value = "";
    errorTrackId.value = null;
  }

  function setPlaybackError(trackId: string | null, error: unknown) {
    errorTrackId.value = trackId;
    errorMessage.value = toErrorMessage(audio, error);
  }

  function pausePlayback() {
    audio.pause();
    isPlaying.value = false;
  }

  async function resumeCurrent() {
    const track = currentTrack.value;
    if (!track) {
      pausePlayback();
      return false;
    }

    if (audio.src !== track.audioSrc) {
      audio.src = track.audioSrc;
      audio.load();
    }

    try {
      await audio.play();
      isPlaying.value = true;
      rememberRecent(track.id);
      clearPlaybackError();
      return true;
    } catch (error) {
      isPlaying.value = false;
      setPlaybackError(track.id, error);
      return false;
    }
  }

  async function playAtIndex(nextIndex: number) {
    const safeIndex = clampIndex(nextIndex);
    currentIndex.value = safeIndex;

    const track = currentTrack.value;
    if (!track) {
      pausePlayback();
      return false;
    }

    currentTime.value = 0;
    duration.value = 0;
    audio.src = track.audioSrc;
    audio.currentTime = 0;
    audio.load();

    return resumeCurrent();
  }

  async function recoverFromPlaybackError() {
    const next = resolveErrorRecovery({
      currentIndex: currentIndex.value,
      trackCount: queue.value.length,
      mode: mode.value,
    });

    currentIndex.value = clampIndex(next.nextIndex);
    if (!next.shouldPlay) {
      pausePlayback();
      return;
    }

    await playAtIndex(next.nextIndex);
  }

  async function handleEnded() {
    const next = resolveEndedAction({
      currentIndex: currentIndex.value,
      trackCount: queue.value.length,
      mode: mode.value,
    });

    currentIndex.value = clampIndex(next.nextIndex);
    if (!next.shouldPlay) {
      pausePlayback();
      return;
    }

    if (next.shouldReplay) {
      seekTo(0);
      await resumeCurrent();
      return;
    }

    await playAtIndex(next.nextIndex);
  }

  lifecycleBridge = {
    onLoadedMetadata: () => {
      syncDurationFromAudio();
    },
    onTimeUpdate: () => {
      syncCurrentTimeFromAudio();
    },
    onEnded: () => {
      void handleEnded();
    },
    onError: () => {
      setPlaybackError(currentTrack.value?.id ?? null, null);
      void recoverFromPlaybackError();
    },
  };
  bindLifecycleOnce(audio);

  async function playContext(nextQueue: Track[], trackId: string) {
    queue.value = [...nextQueue];

    const selection = resolveQueueSelection({
      trackIds: queue.value.map(track => track.id),
      trackId,
    });

    currentIndex.value = clampIndex(selection.nextIndex);
    currentTime.value = 0;
    duration.value = 0;

    if (!selection.found) {
      pausePlayback();
      return;
    }

    await playAtIndex(selection.nextIndex);
  }

  async function playTrackById(trackId: string) {
    const selection = resolveQueueSelection({
      trackIds: queue.value.map(track => track.id),
      trackId,
    });
    if (!selection.found) {
      return;
    }

    await playAtIndex(selection.nextIndex);
  }

  async function togglePlay() {
    if (isPlaying.value) {
      pausePlayback();
      return;
    }

    await resumeCurrent();
  }

  async function playNext() {
    const next = resolveNextAction({
      currentIndex: currentIndex.value,
      trackCount: queue.value.length,
      mode: mode.value,
    });

    currentIndex.value = clampIndex(next.nextIndex);
    if (!next.shouldPlay) {
      pausePlayback();
      return;
    }

    await playAtIndex(next.nextIndex);
  }

  async function playPrevious() {
    const previous = resolvePreviousAction({
      currentIndex: currentIndex.value,
      currentTime: currentTime.value,
      trackCount: queue.value.length,
    });

    currentIndex.value = clampIndex(previous.nextIndex);
    if (previous.shouldRestart) {
      seekTo(0);
      return;
    }

    await playAtIndex(previous.nextIndex);
  }

  function seekTo(nextTime: number) {
    const safeTime = duration.value > 0
      ? Math.min(toSafeTime(nextTime), duration.value)
      : toSafeTime(nextTime);
    audio.currentTime = safeTime;
    currentTime.value = safeTime;
  }

  function setVolume(nextVolume: number) {
    const safeVolume = clampVolume(nextVolume);
    volume.value = safeVolume;
    audio.volume = safeVolume;
  }

  function toggleMute() {
    muted.value = !muted.value;
    audio.muted = muted.value;
  }

  function cycleMode() {
    const orderedModes: PlaybackMode[] = ["sequential", "repeat-all", "repeat-one"];
    const currentModeIndex = orderedModes.indexOf(mode.value);
    mode.value = orderedModes[(currentModeIndex + 1) % orderedModes.length];
  }

  function toggleLike(trackId: string) {
    const nextLikedIds = new Set(likedIds.value);
    if (nextLikedIds.has(trackId)) {
      nextLikedIds.delete(trackId);
    } else {
      nextLikedIds.add(trackId);
    }

    likedIds.value = nextLikedIds;
  }

  return {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    mode,
    likedIds,
    recentPlayIds,
    errorMessage,
    errorTrackId,
    playContext,
    playTrackById,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    cycleMode,
    toggleLike,
    clearPlaybackError,
  };
});
