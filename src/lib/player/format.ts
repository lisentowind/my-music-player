export function formatDuration(totalSeconds: number) {
  const safeTotalSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0
    ? Math.floor(totalSeconds)
    : 0;
  const minutes = Math.floor(safeTotalSeconds / 60);
  const seconds = (safeTotalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}
