import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loadMock = vi.fn();
const onMock = vi.fn();
const syncMock = vi.fn();

vi.mock("liricle", () => ({
  default: class FakeLiricle {
    data = [] as Array<{ text: string; time: number }>;
    offset = 0;
    load = loadMock;
    on = onMock;
    sync = syncMock;
  },
}));

describe("useLyricsStore", () => {
  beforeEach(() => {
    vi.resetModules();
    setActivePinia(createPinia());
    loadMock.mockReset();
    onMock.mockReset();
    syncMock.mockReset();
  });

  it("有歌词时能根据时间高亮当前行", async () => {
    const { useLyricsStore } = await import("@/stores/lyrics");
    const store = useLyricsStore();

    store.loadFromText("[00:00.00]晨雾回声\n[00:08.20]城市刚醒来\n[00:16.40]呼吸落在玻璃上", "track-dawn-echo");
    store.updateTime(9);

    expect(store.lines.length).toBeGreaterThan(0);
    expect(store.activeLineIndex).toBe(1);
    expect(store.activeLine?.text).toContain("城市刚醒来");
  });

  it("无歌词时返回空状态", async () => {
    const { useLyricsStore } = await import("@/stores/lyrics");
    const store = useLyricsStore();

    store.loadFromText(null, "track-orbit-glow");

    expect(store.lines).toEqual([]);
    expect(store.activeLineIndex).toBe(-1);
    expect(store.isEmpty).toBe(true);
  });

  it("切歌时会重置并重新加载歌词上下文", async () => {
    const { useLyricsStore } = await import("@/stores/lyrics");
    const store = useLyricsStore();

    store.loadFromText("[00:00.00]第一首", "track-a");
    store.updateTime(1);
    expect(store.activeLineIndex).toBe(0);

    store.loadFromText("[00:00.00]第二首\n[00:05.00]副歌", "track-b");

    expect(store.currentTrackId).toBe("track-b");
    expect(store.activeLineIndex).toBe(0);
    expect(store.lines[0]?.text).toBe("第二首");
  });

  it("首句时间晚于 0 秒时，不会提前高亮第一句", async () => {
    const { useLyricsStore } = await import("@/stores/lyrics");
    const store = useLyricsStore();

    store.loadFromText("[00:05.00]副歌才开始", "track-late-lyric", 0);

    expect(store.activeLineIndex).toBe(-1);
    store.updateTime(5);
    expect(store.activeLineIndex).toBe(0);
  });
});
