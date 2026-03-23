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

  it("restarts current track when current track is the first one", () => {
    expect(resolvePreviousAction({ currentIndex: 0, currentTime: 1, trackCount: 5 })).toEqual({
      nextIndex: 0,
      shouldRestart: true,
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

  it("wraps to the first track in list-loop mode", () => {
    expect(resolveNextAction({ currentIndex: 4, trackCount: 5, mode: "list-loop" })).toEqual({
      nextIndex: 0,
      shouldPlay: true,
    });
  });
});

describe("resolveEndedAction", () => {
  it("replays current track in single-loop mode", () => {
    expect(resolveEndedAction({ currentIndex: 3, trackCount: 5, mode: "single-loop" })).toEqual({
      nextIndex: 3,
      shouldPlay: true,
      shouldReplay: true,
    });
  });
});

describe("resolveErrorRecovery", () => {
  it("moves to next track when recoverable", () => {
    expect(resolveErrorRecovery({ currentIndex: 1, trackCount: 3, mode: "sequential" })).toEqual({
      nextIndex: 2,
      shouldPlay: true,
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
