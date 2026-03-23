export type PlaybackMode = "sequential" | "list-loop" | "single-loop";

interface BaseInput {
  currentIndex: number;
  trackCount: number;
}

interface PreviousInput extends BaseInput {
  currentTime: number;
}

interface NextInput extends BaseInput {
  mode: PlaybackMode;
}

interface QueueSelectionInput {
  trackIds: string[];
  trackId: string;
}

function clampIndex(currentIndex: number, trackCount: number) {
  if (trackCount <= 0) {
    return 0;
  }

  return Math.min(Math.max(currentIndex, 0), trackCount - 1);
}

export function resolvePreviousAction({ currentIndex, currentTime, trackCount }: PreviousInput) {
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

export function resolveNextAction({ currentIndex, trackCount, mode }: NextInput) {
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

  if (mode === "list-loop") {
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

export function resolveEndedAction({ currentIndex, trackCount, mode }: NextInput) {
  const safeIndex = clampIndex(currentIndex, trackCount);
  if (mode === "single-loop") {
    return {
      nextIndex: safeIndex,
      shouldPlay: true,
      shouldReplay: true,
    };
  }

  const next = resolveNextAction({ currentIndex: safeIndex, trackCount, mode });
  return {
    nextIndex: next.nextIndex,
    shouldPlay: next.shouldPlay,
    shouldReplay: false,
  };
}

export function resolveErrorRecovery({ currentIndex, trackCount, mode }: NextInput) {
  const fallbackMode = mode === "single-loop" ? "sequential" : mode;
  const next = resolveNextAction({ currentIndex, trackCount, mode: fallbackMode });

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
