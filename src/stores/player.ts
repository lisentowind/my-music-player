import { defineStore } from "pinia";
import { computed, onScopeDispose, ref } from "vue";
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

interface LifecycleSubscriber {
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onEnded: () => void;
  onError: () => void;
}

interface AudioLifecycleBinding {
  subscribers: Set<LifecycleSubscriber>;
  handlers: {
    loadedmetadata: () => void;
    timeupdate: () => void;
    ended: () => void;
    error: () => void;
  };
}

let sharedAudio: AudioLike | null = null;
const lifecycleBindings = new WeakMap<AudioLike, AudioLifecycleBinding>();

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

function getOrCreateLifecycleBinding(audio: AudioLike) {
  const existingBinding = lifecycleBindings.get(audio);
  if (existingBinding) {
    return existingBinding;
  }

  const subscribers = new Set<LifecycleSubscriber>();
  const binding: AudioLifecycleBinding = {
    subscribers,
    handlers: {
      loadedmetadata: () => {
        for (const subscriber of [...binding.subscribers]) {
          subscriber.onLoadedMetadata();
        }
      },
      timeupdate: () => {
        for (const subscriber of [...binding.subscribers]) {
          subscriber.onTimeUpdate();
        }
      },
      ended: () => {
        for (const subscriber of [...binding.subscribers]) {
          subscriber.onEnded();
        }
      },
      error: () => {
        for (const subscriber of [...binding.subscribers]) {
          subscriber.onError();
        }
      },
    },
  };

  audio.addEventListener("loadedmetadata", binding.handlers.loadedmetadata);
  audio.addEventListener("timeupdate", binding.handlers.timeupdate);
  audio.addEventListener("ended", binding.handlers.ended);
  audio.addEventListener("error", binding.handlers.error);
  lifecycleBindings.set(audio, binding);

  return binding;
}

function bindAudioLifecycle(audio: AudioLike, subscriber: LifecycleSubscriber) {
  const binding = getOrCreateLifecycleBinding(audio);
  binding.subscribers.add(subscriber);

  return () => {
    const currentBinding = lifecycleBindings.get(audio);
    if (!currentBinding) {
      return;
    }

    currentBinding.subscribers.delete(subscriber);
    if (currentBinding.subscribers.size > 0) {
      return;
    }

    audio.removeEventListener("loadedmetadata", currentBinding.handlers.loadedmetadata);
    audio.removeEventListener("timeupdate", currentBinding.handlers.timeupdate);
    audio.removeEventListener("ended", currentBinding.handlers.ended);
    audio.removeEventListener("error", currentBinding.handlers.error);
    lifecycleBindings.delete(audio);
  };
}

function toTrackIds(queue: readonly Track[]) {
  return queue.map(track => track.id);
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
  const likedTrackIdList = computed(() => [...likedIds.value]);
  const likedCount = computed(() => likedIds.value.size);
  const recentPlayIds = ref<string[]>([]);
  const errorMessage = ref("");
  const errorTrackId = ref<string | null>(null);
  const currentTrack = computed(() => queue.value[currentIndex.value] ?? null);

  const audio = getSharedAudio();
  audio.volume = volume.value;
  audio.muted = muted.value;

  let actionToken = 0;
  let disposed = false;

  function beginAction() {
    actionToken += 1;
    return actionToken;
  }

  function isActionCurrent(token: number) {
    return !disposed && token === actionToken;
  }

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

  function isBoundToCurrentAudioSource() {
    const track = currentTrack.value;
    return Boolean(track && track.audioSrc === audio.src);
  }

  async function playCurrentWithToken(token: number) {
    if (!isActionCurrent(token)) {
      return false;
    }

    const track = currentTrack.value;
    if (!track) {
      if (isActionCurrent(token)) {
        pausePlayback();
      }
      return false;
    }

    if (audio.src !== track.audioSrc) {
      audio.src = track.audioSrc;
      audio.currentTime = 0;
      currentTime.value = 0;
      duration.value = 0;
      audio.load();
    }

    try {
      await audio.play();
    } catch (error) {
      if (isActionCurrent(token) && currentTrack.value?.id === track.id) {
        isPlaying.value = false;
        setPlaybackError(track.id, error);
      }
      return false;
    }

    if (!isActionCurrent(token) || currentTrack.value?.id !== track.id) {
      return false;
    }

    isPlaying.value = true;
    rememberRecent(track.id);
    clearPlaybackError();
    return true;
  }

  async function playAtIndexWithToken(nextIndex: number, token: number) {
    if (!isActionCurrent(token)) {
      return false;
    }

    const safeIndex = clampIndex(nextIndex);
    const track = queue.value[safeIndex];
    if (!track) {
      if (isActionCurrent(token)) {
        pausePlayback();
      }
      return false;
    }

    currentIndex.value = safeIndex;
    currentTime.value = 0;
    duration.value = 0;
    audio.src = track.audioSrc;
    audio.currentTime = 0;
    audio.load();

    return playCurrentWithToken(token);
  }

  async function handleEndedEvent() {
    if (!isBoundToCurrentAudioSource()) {
      return;
    }

    const token = beginAction();
    const next = resolveEndedAction({
      currentIndex: currentIndex.value,
      trackCount: queue.value.length,
      mode: mode.value,
    });

    currentIndex.value = clampIndex(next.nextIndex);
    if (!next.shouldPlay) {
      if (isActionCurrent(token)) {
        pausePlayback();
      }
      return;
    }

    if (next.shouldReplay) {
      seekTo(0);
      await playCurrentWithToken(token);
      return;
    }

    await playAtIndexWithToken(next.nextIndex, token);
  }

  async function handleErrorEvent() {
    const failedTrack = currentTrack.value;
    if (!failedTrack || failedTrack.audioSrc !== audio.src) {
      return;
    }

    const token = beginAction();
    setPlaybackError(failedTrack.id, null);

    const recovery = resolveErrorRecovery({
      currentIndex: currentIndex.value,
      trackCount: queue.value.length,
      mode: mode.value,
    });

    currentIndex.value = clampIndex(recovery.nextIndex);
    if (!recovery.shouldPlay) {
      if (isActionCurrent(token)) {
        pausePlayback();
      }
      return;
    }

    await playAtIndexWithToken(recovery.nextIndex, token);
  }

  const unbindAudioLifecycle = bindAudioLifecycle(audio, {
    onLoadedMetadata: () => {
      if (!isBoundToCurrentAudioSource()) {
        return;
      }

      syncDurationFromAudio();
    },
    onTimeUpdate: () => {
      if (!isBoundToCurrentAudioSource()) {
        return;
      }

      syncCurrentTimeFromAudio();
    },
    onEnded: () => {
      void handleEndedEvent();
    },
    onError: () => {
      void handleErrorEvent();
    },
  });

  onScopeDispose(() => {
    disposed = true;
    beginAction();
    unbindAudioLifecycle();
  });

  async function playContext(nextQueue: Track[], trackId: string) {
    const selection = resolveQueueSelection({
      trackIds: toTrackIds(nextQueue),
      trackId,
    });
    if (!selection.found) {
      return;
    }

    const token = beginAction();
    queue.value = [...nextQueue];
    await playAtIndexWithToken(selection.nextIndex, token);
  }

  async function playTrackById(trackId: string) {
    const selection = resolveQueueSelection({
      trackIds: toTrackIds(queue.value),
      trackId,
    });
    if (!selection.found) {
      return;
    }

    const token = beginAction();
    await playAtIndexWithToken(selection.nextIndex, token);
  }

  async function togglePlay() {
    if (isPlaying.value) {
      beginAction();
      pausePlayback();
      return;
    }

    const token = beginAction();
    await playCurrentWithToken(token);
  }

  async function playNext() {
    const token = beginAction();
    const next = resolveNextAction({
      currentIndex: currentIndex.value,
      trackCount: queue.value.length,
      mode: mode.value,
    });

    currentIndex.value = clampIndex(next.nextIndex);
    if (!next.shouldPlay) {
      if (isActionCurrent(token)) {
        pausePlayback();
      }
      return;
    }

    await playAtIndexWithToken(next.nextIndex, token);
  }

  async function playPrevious() {
    const previous = resolvePreviousAction({
      currentIndex: currentIndex.value,
      currentTime: currentTime.value,
      trackCount: queue.value.length,
    });

    const token = beginAction();
    currentIndex.value = clampIndex(previous.nextIndex);
    if (previous.shouldRestart) {
      seekTo(0);
      return;
    }

    await playAtIndexWithToken(previous.nextIndex, token);
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
    likedTrackIdList,
    likedCount,
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
