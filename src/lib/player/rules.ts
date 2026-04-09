import type { PlaybackMode } from "@/types/music";
import { createStableShuffleQueue, findTrackIndexInQueue } from "@/lib/player/queue";

interface BaseInput {
  currentIndex: number;
  trackCount: number;
}

interface ShuffleInput {
  trackIds?: readonly string[];
  contextId?: string;
  shuffleAnchorTrackId?: string | null;
}

interface PreviousInput extends BaseInput, ShuffleInput {
  currentTime: number;
  mode?: PlaybackMode;
}

interface NextInput extends BaseInput, ShuffleInput {
  mode: PlaybackMode;
}

interface QueueSelectionInput {
  trackIds: readonly string[];
  trackId: string;
}

export interface PreviousAction {
  nextIndex: number;
  shouldRestart: boolean;
}

export interface NextAction {
  nextIndex: number;
  shouldPlay: boolean;
}

export interface EndedAction extends NextAction {
  shouldReplay: boolean;
}

export type ErrorRecoveryAction = NextAction;

export interface QueueSelectionAction {
  nextIndex: number;
  found: boolean;
}

function clampIndex(currentIndex: number, trackCount: number) {
  if (trackCount <= 0) {
    return 0;
  }

  return Math.min(Math.max(currentIndex, 0), trackCount - 1);
}

function resolveShuffleState({
  currentIndex,
  trackCount,
  trackIds,
  contextId,
  shuffleAnchorTrackId,
}: BaseInput & ShuffleInput) {
  if (!trackIds || trackIds.length <= 0 || trackCount <= 0) {
    return null;
  }

  const boundedCount = Math.min(trackCount, trackIds.length);
  const safeIndex = clampIndex(currentIndex, boundedCount);
  const currentTrackId = trackIds[safeIndex];
  const anchorTrackId = shuffleAnchorTrackId ?? currentTrackId;
  if (!currentTrackId || !anchorTrackId) {
    return null;
  }

  const shuffledTrackIds = createStableShuffleQueue({
    trackIds,
    currentTrackId: anchorTrackId,
    contextId: contextId ?? "default",
  });
  const shuffleIndex = findTrackIndexInQueue(shuffledTrackIds, currentTrackId);
  if (shuffleIndex < 0) {
    return null;
  }

  return {
    safeIndex,
    shuffledTrackIds,
    shuffleIndex,
  };
}

function resolveLinearNextAction({ currentIndex, trackCount }: BaseInput): NextAction {
  if (trackCount <= 0) {
    return {
      nextIndex: 0,
      shouldPlay: false,
    };
  }

  const safeIndex = clampIndex(currentIndex, trackCount);
  if (safeIndex < trackCount - 1) {
    return {
      nextIndex: safeIndex + 1,
      shouldPlay: true,
    };
  }

  return {
    nextIndex: safeIndex,
    shouldPlay: false,
  };
}

function resolveShuffleNextAction(input: NextInput): NextAction {
  const shuffleState = resolveShuffleState(input);
  if (!shuffleState) {
    return resolveLinearNextAction(input);
  }

  const { safeIndex, shuffledTrackIds, shuffleIndex } = shuffleState;
  const nextTrackId = shuffledTrackIds[shuffleIndex + 1];
  if (!nextTrackId) {
    return {
      nextIndex: safeIndex,
      shouldPlay: false,
    };
  }

  const nextIndex = findTrackIndexInQueue(input.trackIds ?? [], nextTrackId);
  if (nextIndex < 0) {
    return {
      nextIndex: safeIndex,
      shouldPlay: false,
    };
  }

  return {
    nextIndex,
    shouldPlay: true,
  };
}

export function resolvePreviousAction({
  currentIndex,
  currentTime,
  trackCount,
  mode = "sequential",
  trackIds,
  contextId,
  shuffleAnchorTrackId,
}: PreviousInput): PreviousAction {
  if (trackCount <= 0) {
    return {
      nextIndex: 0,
      shouldRestart: false,
    };
  }

  const safeIndex = clampIndex(currentIndex, trackCount);
  if (mode === "shuffle") {
    const shuffleState = resolveShuffleState({
      currentIndex: safeIndex,
      trackCount,
      trackIds,
      contextId,
      shuffleAnchorTrackId,
    });
    if (shuffleState) {
      const { shuffledTrackIds, shuffleIndex } = shuffleState;
      const previousTrackId = shuffledTrackIds[shuffleIndex - 1] ?? shuffledTrackIds.at(-1);
      if (!previousTrackId || previousTrackId === (trackIds ?? [])[safeIndex]) {
        return {
          nextIndex: safeIndex,
          shouldRestart: true,
        };
      }

      const previousIndex = findTrackIndexInQueue(trackIds ?? [], previousTrackId);
      if (previousIndex >= 0) {
        return {
          nextIndex: previousIndex,
          shouldRestart: false,
        };
      }
    }
  }

  if (mode === "repeat-one") {
    if (safeIndex <= 0) {
      return {
        nextIndex: 0,
        shouldRestart: true,
      };
    }

    return {
      nextIndex: safeIndex - 1,
      shouldRestart: false,
    };
  }

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

export function resolveNextAction(input: NextInput): NextAction {
  if (input.mode === "shuffle") {
    return resolveShuffleNextAction(input);
  }

  return resolveLinearNextAction(input);
}

export function resolveEndedAction(input: NextInput): EndedAction {
  const { currentIndex, trackCount, mode } = input;
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

  const next = resolveNextAction({ ...input, currentIndex: safeIndex });
  return {
    nextIndex: next.nextIndex,
    shouldPlay: next.shouldPlay,
    shouldReplay: false,
  };
}

export function resolveErrorRecovery(input: NextInput): ErrorRecoveryAction {
  const fallbackMode: PlaybackMode = input.mode === "repeat-one" ? "sequential" : input.mode;
  const next = resolveNextAction({
    ...input,
    mode: fallbackMode,
  });

  return {
    nextIndex: next.nextIndex,
    shouldPlay: next.shouldPlay,
  };
}

export function resolveQueueSelection({ trackIds, trackId }: QueueSelectionInput): QueueSelectionAction {
  const nextIndex = findTrackIndexInQueue(trackIds, trackId);
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
