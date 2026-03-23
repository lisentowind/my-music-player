import { describe, expect, it } from "vitest";
import {
  resolveEndedAction,
  resolveErrorRecovery,
  resolveNextAction,
  resolvePreviousAction,
  resolveQueueSelection,
} from "@/lib/player/rules";

describe("resolvePreviousAction", () => {
  it("rewinds to the beginning when current time is over 3 seconds", () => {
    expect(resolvePreviousAction({ currentIndex: 2, currentTime: 8, trackCount: 5 })).toEqual({
      nextIndex: 2,
      shouldRestart: true,
    });
  });

  it("goes to the real previous track when current time is at most 3 seconds", () => {
    expect(resolvePreviousAction({ currentIndex: 2, currentTime: 2.5, trackCount: 5 })).toEqual({
      nextIndex: 1,
      shouldRestart: false,
    });
  });

  it("uses previous-track branch at currentTime === 3 boundary", () => {
    expect(resolvePreviousAction({ currentIndex: 2, currentTime: 3, trackCount: 5 })).toEqual({
      nextIndex: 1,
      shouldRestart: false,
    });
  });

  it("restarts current track when current track is the first one", () => {
    expect(resolvePreviousAction({ currentIndex: 0, currentTime: 1, trackCount: 5 })).toEqual({
      nextIndex: 0,
      shouldRestart: true,
    });
  });

  it("clamps negative currentIndex and restarts first track", () => {
    expect(resolvePreviousAction({ currentIndex: -5, currentTime: 1, trackCount: 4 })).toEqual({
      nextIndex: 0,
      shouldRestart: true,
    });
  });

  it("clamps out-of-range currentIndex and moves to previous from the last valid track", () => {
    expect(resolvePreviousAction({ currentIndex: 99, currentTime: 1, trackCount: 4 })).toEqual({
      nextIndex: 2,
      shouldRestart: false,
    });
  });

  it("returns no-op when trackCount is zero or negative", () => {
    expect(resolvePreviousAction({ currentIndex: 2, currentTime: 8, trackCount: 0 })).toEqual({
      nextIndex: 0,
      shouldRestart: false,
    });
    expect(resolvePreviousAction({ currentIndex: 2, currentTime: 8, trackCount: -1 })).toEqual({
      nextIndex: 0,
      shouldRestart: false,
    });
  });
});

describe("resolveNextAction", () => {
  it("stays at the last track in sequential mode", () => {
    expect(resolveNextAction({ currentIndex: 4, trackCount: 5, mode: "sequential" })).toEqual({
      nextIndex: 4,
      shouldPlay: false,
    });
  });

  it("wraps to the first track in repeat-all mode", () => {
    expect(resolveNextAction({ currentIndex: 4, trackCount: 5, mode: "repeat-all" })).toEqual({
      nextIndex: 0,
      shouldPlay: true,
    });
  });

  it("handles empty queue by stopping playback", () => {
    expect(resolveNextAction({ currentIndex: 0, trackCount: 0, mode: "sequential" })).toEqual({
      nextIndex: 0,
      shouldPlay: false,
    });
  });
});

describe("playback mode aliases", () => {
  it("maps list-loop to repeat-all behavior", () => {
    expect(resolveNextAction({ currentIndex: 4, trackCount: 5, mode: "list-loop" })).toEqual({
      nextIndex: 0,
      shouldPlay: true,
    });
  });

  it("maps single-loop to repeat-one behavior", () => {
    expect(resolveEndedAction({ currentIndex: 3, trackCount: 5, mode: "single-loop" })).toEqual({
      nextIndex: 3,
      shouldPlay: true,
      shouldReplay: true,
    });
  });
});

describe("resolveEndedAction", () => {
  it("moves to next in sequential mode when not at the end", () => {
    expect(resolveEndedAction({ currentIndex: 1, trackCount: 5, mode: "sequential" })).toEqual({
      nextIndex: 2,
      shouldPlay: true,
      shouldReplay: false,
    });
  });

  it("stops in sequential mode at the end", () => {
    expect(resolveEndedAction({ currentIndex: 4, trackCount: 5, mode: "sequential" })).toEqual({
      nextIndex: 4,
      shouldPlay: false,
      shouldReplay: false,
    });
  });

  it("wraps in repeat-all mode", () => {
    expect(resolveEndedAction({ currentIndex: 4, trackCount: 5, mode: "repeat-all" })).toEqual({
      nextIndex: 0,
      shouldPlay: true,
      shouldReplay: false,
    });
  });

  it("replays current track in repeat-one mode", () => {
    expect(resolveEndedAction({ currentIndex: 3, trackCount: 5, mode: "repeat-one" })).toEqual({
      nextIndex: 3,
      shouldPlay: true,
      shouldReplay: true,
    });
  });

  it("stops when queue is empty regardless of mode", () => {
    expect(resolveEndedAction({ currentIndex: 0, trackCount: 0, mode: "repeat-one" })).toEqual({
      nextIndex: 0,
      shouldPlay: false,
      shouldReplay: false,
    });
  });
});

describe("resolveErrorRecovery", () => {
  it("moves to next track in sequential mode when recoverable", () => {
    expect(resolveErrorRecovery({ currentIndex: 1, trackCount: 3, mode: "sequential" })).toEqual({
      nextIndex: 2,
      shouldPlay: true,
    });
  });

  it("falls back to sequential behavior from repeat-one mode", () => {
    expect(resolveErrorRecovery({ currentIndex: 2, trackCount: 3, mode: "repeat-one" })).toEqual({
      nextIndex: 2,
      shouldPlay: false,
    });
  });

  it("wraps in repeat-all mode while recovering", () => {
    expect(resolveErrorRecovery({ currentIndex: 2, trackCount: 3, mode: "repeat-all" })).toEqual({
      nextIndex: 0,
      shouldPlay: true,
    });
  });

  it("stops when there are no tracks to recover with", () => {
    expect(resolveErrorRecovery({ currentIndex: 0, trackCount: 0, mode: "repeat-all" })).toEqual({
      nextIndex: 0,
      shouldPlay: false,
    });
  });
});

describe("resolveQueueSelection", () => {
  it("returns fallback index when trackId is missing", () => {
    expect(resolveQueueSelection({ trackIds: ["a", "b", "c"], trackId: "x" })).toEqual({
      nextIndex: 0,
      found: false,
    });
  });

  it("returns matched index when trackId exists", () => {
    expect(resolveQueueSelection({ trackIds: ["a", "b", "c"], trackId: "b" })).toEqual({
      nextIndex: 1,
      found: true,
    });
  });
});
