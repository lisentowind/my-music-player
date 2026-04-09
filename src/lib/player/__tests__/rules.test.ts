import { describe, expect, it } from "vitest";
import { createStableShuffleQueue } from "@/lib/player/queue";
import {
  resolveEndedAction,
  resolveErrorRecovery,
  resolveNextAction,
  resolvePreviousAction,
  resolveQueueSelection,
} from "@/lib/player/rules";

describe("player rules (Task 4)", () => {
  it("顺序播放到最后一首后停止并停在最后一首", () => {
    expect(resolveEndedAction({ currentIndex: 4, trackCount: 5, mode: "sequential" })).toEqual({
      nextIndex: 4,
      shouldPlay: false,
      shouldReplay: false,
    });
  });

  it("单曲循环结束后重播当前曲目", () => {
    expect(resolveEndedAction({ currentIndex: 2, trackCount: 5, mode: "repeat-one" })).toEqual({
      nextIndex: 2,
      shouldPlay: true,
      shouldReplay: true,
    });
  });

  it("单曲循环模式下手动 next / previous 仍切换到相邻曲目", () => {
    expect(resolveNextAction({ currentIndex: 2, trackCount: 5, mode: "repeat-one" })).toEqual({
      nextIndex: 3,
      shouldPlay: true,
    });

    expect(resolvePreviousAction({
      currentIndex: 2,
      currentTime: 20,
      trackCount: 5,
      mode: "repeat-one",
    })).toEqual({
      nextIndex: 1,
      shouldRestart: false,
    });
  });

  it("随机播放下 next / previous 按稳定随机顺序移动", () => {
    const trackIds = ["t1", "t2", "t3", "t4", "t5"] as const;
    const contextId = "ctx-a";
    const shuffleQueue = createStableShuffleQueue({
      trackIds,
      currentTrackId: "t2",
      contextId,
    });
    const currentTrackId = "t2";
    const shuffleIndex = shuffleQueue.indexOf(currentTrackId);
    const nextTrackId = shuffleQueue[shuffleIndex + 1]!;
    const previousTrackId = shuffleQueue[shuffleIndex - 1] ?? shuffleQueue.at(-1)!;

    expect(resolveNextAction({
      currentIndex: trackIds.indexOf(currentTrackId),
      trackCount: trackIds.length,
      mode: "shuffle",
      trackIds,
      contextId,
      shuffleAnchorTrackId: currentTrackId,
    })).toEqual({
      nextIndex: trackIds.indexOf(nextTrackId),
      shouldPlay: true,
    });

    expect(resolvePreviousAction({
      currentIndex: trackIds.indexOf(currentTrackId),
      currentTime: 1,
      trackCount: trackIds.length,
      mode: "shuffle",
      trackIds,
      contextId,
      shuffleAnchorTrackId: currentTrackId,
    })).toEqual({
      nextIndex: trackIds.indexOf(previousTrackId),
      shouldRestart: false,
    });
  });

  it("随机队列最后一首播完后停止并停在最后一首", () => {
    const trackIds = ["t1", "t2", "t3", "t4", "t5"] as const;
    const contextId = "ctx-a";
    const shuffleQueue = createStableShuffleQueue({
      trackIds,
      currentTrackId: "t2",
      contextId,
    });
    const lastTrackId = shuffleQueue.at(-1)!;

    expect(resolveEndedAction({
      currentIndex: trackIds.indexOf(lastTrackId),
      trackCount: trackIds.length,
      mode: "shuffle",
      trackIds,
      contextId,
      shuffleAnchorTrackId: "t2",
    })).toEqual({
      nextIndex: trackIds.indexOf(lastTrackId),
      shouldPlay: false,
      shouldReplay: false,
    });
  });

  it("从任意当前曲目进入 shuffle 后，连续 next 可以走完整个随机序列", () => {
    const trackIds = ["t1", "t2", "t3", "t4", "t5"] as const;
    const contextId = "ctx-full-walk";
    const currentTrackId = "t3";
    let currentIndex = trackIds.indexOf(currentTrackId);
    const visitedTrackIds = [trackIds[currentIndex]];

    while (true) {
      const next = resolveNextAction({
        currentIndex,
        trackCount: trackIds.length,
        mode: "shuffle",
        trackIds,
        contextId,
        shuffleAnchorTrackId: currentTrackId,
      });

      if (!next.shouldPlay) {
        break;
      }

      currentIndex = next.nextIndex;
      visitedTrackIds.push(trackIds[currentIndex]);
    }

    expect(new Set(visitedTrackIds)).toEqual(new Set(trackIds));
    expect(visitedTrackIds[0]).toBe(currentTrackId);
  });

  it("错误恢复在 repeat-one 下退回到相邻下一首，在 shuffle 下沿稳定随机顺序继续", () => {
    expect(resolveErrorRecovery({ currentIndex: 1, trackCount: 3, mode: "repeat-one" })).toEqual({
      nextIndex: 2,
      shouldPlay: true,
    });

    const trackIds = ["t1", "t2", "t3", "t4"] as const;
    const contextId = "ctx-recovery";
    const shuffleQueue = createStableShuffleQueue({
      trackIds,
      currentTrackId: "t2",
      contextId,
    });
    const currentTrackId = "t2";
    const currentIndex = trackIds.indexOf(currentTrackId);
    const nextTrackId = shuffleQueue[shuffleQueue.indexOf(currentTrackId) + 1]!;

    expect(resolveErrorRecovery({
      currentIndex,
      trackCount: trackIds.length,
      mode: "shuffle",
      trackIds,
      contextId,
      shuffleAnchorTrackId: currentTrackId,
    })).toEqual({
      nextIndex: trackIds.indexOf(nextTrackId),
      shouldPlay: true,
    });
  });

  it("选择队列中的曲目时返回命中索引，缺失时回退到 0", () => {
    expect(resolveQueueSelection({ trackIds: ["a", "b", "c"], trackId: "b" })).toEqual({
      nextIndex: 1,
      found: true,
    });

    expect(resolveQueueSelection({ trackIds: ["a", "b", "c"], trackId: "x" })).toEqual({
      nextIndex: 0,
      found: false,
    });
  });
});
