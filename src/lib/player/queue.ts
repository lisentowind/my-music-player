interface StableShuffleQueueInput {
  trackIds: readonly string[];
  currentTrackId: string;
  contextId: string;
}

function toUniqueTrackIds(trackIds: readonly string[]) {
  return [...new Set(trackIds)];
}

function fnv1a32(input: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function createStableShuffleQueue({ trackIds, currentTrackId, contextId }: StableShuffleQueueInput) {
  const uniqueTrackIds = toUniqueTrackIds(trackIds);
  if (uniqueTrackIds.length <= 1) {
    return uniqueTrackIds;
  }

  const currentIndex = uniqueTrackIds.indexOf(currentTrackId);
  if (currentIndex < 0) {
    return uniqueTrackIds;
  }

  const remainingTrackIds = uniqueTrackIds.filter(trackId => trackId !== currentTrackId);
  const nextRandom = mulberry32(fnv1a32(`${contextId}:${uniqueTrackIds.join("|")}`));
  for (let index = remainingTrackIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom() * (index + 1));
    const currentTrack = remainingTrackIds[index]!;
    remainingTrackIds[index] = remainingTrackIds[swapIndex]!;
    remainingTrackIds[swapIndex] = currentTrack;
  }

  return [currentTrackId, ...remainingTrackIds];
}

export function findTrackIndexInQueue(trackIds: readonly string[], trackId: string) {
  return trackIds.indexOf(trackId);
}
