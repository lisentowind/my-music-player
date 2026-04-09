import { describe, expect, it } from "vitest";
import { createStableShuffleQueue } from "@/lib/player/queue";

describe("stable shuffle queue", () => {
  const trackIds = ["t1", "t2", "t3", "t4", "t5", "t6", "t7"] as const;

  it("同一上下文生成的随机队列顺序稳定", () => {
    const first = createStableShuffleQueue({
      trackIds,
      currentTrackId: "t3",
      contextId: "playlist:home",
    });
    const second = createStableShuffleQueue({
      trackIds,
      currentTrackId: "t3",
      contextId: "playlist:home",
    });

    expect(second).toEqual(first);
  });

  it("队列中必须包含当前曲目", () => {
    const result = createStableShuffleQueue({
      trackIds,
      currentTrackId: "t5",
      contextId: "playlist:home",
    });

    expect(result).toContain("t5");
    expect(new Set(result)).toEqual(new Set(trackIds));
  });

  it("当前曲目会作为稳定随机队列的起点", () => {
    const result = createStableShuffleQueue({
      trackIds,
      currentTrackId: "t5",
      contextId: "playlist:home",
    });

    expect(result[0]).toBe("t5");
  });

  it("切换上下文后随机顺序会重新生成", () => {
    const fromHome = createStableShuffleQueue({
      trackIds,
      currentTrackId: "t3",
      contextId: "playlist:home",
    });
    const fromLiked = createStableShuffleQueue({
      trackIds,
      currentTrackId: "t3",
      contextId: "playlist:liked",
    });

    expect(fromLiked).not.toEqual(fromHome);
  });
});
