import type { PlaybackMode } from "@/types/music";

type LegacyPlaybackMode = "list-loop" | "single-loop";
type CompatiblePlaybackMode = PlaybackMode | LegacyPlaybackMode;

type StandardPlaybackMode = PlaybackMode;

interface BaseInput {
  currentIndex: number;
  trackCount: number;
}

interface PreviousInput extends BaseInput {
  currentTime: number;
}

interface NextInput extends BaseInput {
  mode: CompatiblePlaybackMode;
}

interface NormalizedNextInput extends BaseInput {
  mode: StandardPlaybackMode;
}

interface QueueSelectionInput {
  trackIds: string[];
  trackId: string;
}

function normalizeMode(mode: CompatiblePlaybackMode): StandardPlaybackMode {
  if (mode === "list-loop") {
    return "repeat-all";
  }

  if (mode === "single-loop") {
    return "repeat-one";
  }

  return mode;
}

function normalizeNextInput({ currentIndex, trackCount, mode }: NextInput): NormalizedNextInput {
  return {
    currentIndex,
    trackCount,
    mode: normalizeMode(mode),
  };
}

function clampIndex(currentIndex: number, trackCount: number) {
  if (trackCount <= 0) {
    return 0;
  }

  return Math.min(Math.max(currentIndex, 0), trackCount - 1);
}

export function resolvePreviousAction({ currentIndex, currentTime, trackCount }: PreviousInput) {
  if (trackCount <= 0) {
    return {
      nextIndex: 0,
      shouldRestart: false,
    };
  }

  const safeIndex = clampIndex(currentIndex, trackCount);
  if (safeIndex === 0 || currentTime > 3) {
    return {
      nextIndex: safeIndex,
      shouldRestart: true,
    };
  }

  return {
    nextIndex: safeIndex - 1,
    shouldRestart: false,
  };
}

function resolveNextActionNormalized({ currentIndex, trackCount, mode }: NormalizedNextInput) {
  if (trackCount <= 0) {
    return {
      nextIndex: 0,
      shouldPlay: false,
    };
  }

  const safeIndex = clampIndex(currentIndex, trackCount);
  const isLastTrack = safeIndex === trackCount - 1;
  if (!isLastTrack) {
    return {
      nextIndex: safeIndex + 1,
      shouldPlay: true,
    };
  }

  if (mode === "repeat-all") {
    return {
      nextIndex: 0,
      shouldPlay: true,
    };
  }

  return {
    nextIndex: safeIndex,
    shouldPlay: false,
  };
}

export function resolveNextAction(input: NextInput) {
  return resolveNextActionNormalized(normalizeNextInput(input));
}

export function resolveEndedAction(input: NextInput) {
  const { currentIndex, trackCount, mode } = normalizeNextInput(input);
  if (trackCount <= 0) {
    return {
      nextIndex: 0,
      shouldPlay: false,
      shouldReplay: false,
    };
  }

  const safeIndex = clampIndex(currentIndex, trackCount);
  if (mode === "repeat-one") {
    return {
      nextIndex: safeIndex,
      shouldPlay: true,
      shouldReplay: true,
    };
  }

  const next = resolveNextActionNormalized({ currentIndex: safeIndex, trackCount, mode });
  return {
    nextIndex: next.nextIndex,
    shouldPlay: next.shouldPlay,
    shouldReplay: false,
  };
}

export function resolveErrorRecovery(input: NextInput) {
  const normalized = normalizeNextInput(input);
  const fallbackMode = normalized.mode === "repeat-one" ? "sequential" : normalized.mode;
  const next = resolveNextActionNormalized({
    currentIndex: normalized.currentIndex,
    trackCount: normalized.trackCount,
    mode: fallbackMode,
  });

  return {
    nextIndex: next.nextIndex,
    shouldPlay: next.shouldPlay,
  };
}

export function resolveQueueSelection({ trackIds, trackId }: QueueSelectionInput) {
  const nextIndex = trackIds.indexOf(trackId);
  if (nextIndex < 0) {
    return {
      nextIndex: 0,
      found: false,
    };
  }

  return {
    nextIndex,
    found: true,
  };
}
