import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { tracks } from "@/data/music-library";

type AudioEventListener = (event: Event) => void;

class FakePlayerAudio {
  src = "";
  currentTime = 0;
  duration = 0;
  volume = 1;
  muted = false;
  paused = true;
  error: { message?: string } | null = null;
  private listeners = new Map<string, Set<AudioEventListener>>();

  play = vi.fn(async () => {
    this.paused = false;
  });

  pause = vi.fn(() => {
    this.paused = true;
  });

  load = vi.fn(() => {});

  addEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
    const normalized = typeof listener === "function"
      ? listener
      : (event: Event) => listener.handleEvent(event);
    const group = this.listeners.get(type) ?? new Set<AudioEventListener>();
    group.add(normalized);
    this.listeners.set(type, group);
  });

  removeEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
    const normalized = typeof listener === "function"
      ? listener
      : (event: Event) => listener.handleEvent(event);
    const group = this.listeners.get(type);
    if (!group) {
      return;
    }

    group.delete(normalized);
    if (group.size === 0) {
      this.listeners.delete(type);
    }
  });

  emit(type: string, payload?: Record<string, unknown>) {
    const event = new Event(type);
    if (payload) {
      for (const [key, value] of Object.entries(payload)) {
        Reflect.set(event as object, key, value);
      }
    }

    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

type PlayerStoreModule = typeof import("@/stores/player");
type PlayerAudioModule = typeof import("@/lib/player/audio");

describe("usePlayerStore", () => {
  let usePlayerStore: PlayerStoreModule["usePlayerStore"];
  let configurePlayerAudioFactory: PlayerAudioModule["configurePlayerAudioFactory"];
  let fakeAudio: FakePlayerAudio;

  beforeEach(async () => {
    vi.resetModules();
    setActivePinia(createPinia());

    fakeAudio = new FakePlayerAudio();
    ({ configurePlayerAudioFactory } = await import("@/lib/player/audio"));
    configurePlayerAudioFactory(() => fakeAudio);
    ({ usePlayerStore } = await import("@/stores/player"));
  });

  it("playTrackById 会切到目标歌曲并进入播放中", async () => {
    const store = usePlayerStore();

    await store.playTrackById("track-dawn-echo");

    expect(store.currentTrack?.id).toBe("track-dawn-echo");
    expect(store.isPlaying).toBe(true);
    expect(fakeAudio.src).toBe("/media/sample-track-01.mp3");
  });

  it("playContext 会切换队列并从目标曲目开始播放", async () => {
    const store = usePlayerStore();
    const queue = [tracks[2], tracks[3], tracks[4]];

    await store.playContext(queue, tracks[3].id);

    expect(store.queue).toEqual(queue);
    expect(store.currentIndex).toBe(1);
    expect(store.currentTrack?.id).toBe(tracks[3].id);
    expect(store.isPlaying).toBe(true);
  });

  it("seekTo 只更新播放进度，不改变播放状态", async () => {
    const store = usePlayerStore();
    await store.playTrackById("track-dawn-echo");
    await store.togglePlay();
    expect(store.isPlaying).toBe(false);

    store.seekTo(12.4);

    expect(store.currentTime).toBe(12.4);
    expect(fakeAudio.currentTime).toBe(12.4);
    expect(store.isPlaying).toBe(false);
  });

  it("顺序模式下在最后一首执行 playNext 会停在末尾并停止播放", async () => {
    const store = usePlayerStore();
    const lastTrack = tracks.slice(-1)[0]!;
    await store.playTrackById(lastTrack.id);
    expect(store.currentIndex).toBe(tracks.length - 1);

    await store.playNext();

    expect(store.currentIndex).toBe(tracks.length - 1);
    expect(store.isPlaying).toBe(false);
    expect(fakeAudio.pause).toHaveBeenCalled();
  });

  it("音频事件会同步 duration 与 currentTime", async () => {
    const store = usePlayerStore();
    await store.playTrackById("track-dawn-echo");

    fakeAudio.duration = 96;
    fakeAudio.currentTime = 33;
    fakeAudio.emit("loadedmetadata");
    fakeAudio.emit("timeupdate");

    expect(store.duration).toBe(96);
    expect(store.currentTime).toBe(33);
  });

  it("error 事件会记录错误并按规则自动恢复到下一首", async () => {
    const store = usePlayerStore();
    await store.playTrackById(tracks[0].id);

    fakeAudio.error = { message: "decode failed" };
    fakeAudio.emit("error");

    expect(store.errorTrackId).toBe(tracks[0].id);
    expect(store.errorMessage).toContain("decode failed");
    expect(store.currentTrack?.id).toBe(tracks[1].id);
    expect(store.isPlaying).toBe(true);
  });

  it("成功播放新歌曲后会清空上一条错误", async () => {
    const store = usePlayerStore();
    await store.playTrackById(tracks[0].id);
    fakeAudio.error = { message: "network" };
    fakeAudio.emit("error");

    await store.playTrackById(tracks[2].id);

    expect(store.errorTrackId).toBeNull();
    expect(store.errorMessage).toBe("");
  });

  it("音频生命周期事件只会绑定一次", async () => {
    const store = usePlayerStore();

    await store.playTrackById(tracks[0].id);
    await store.playTrackById(tracks[1].id);
    await store.togglePlay();
    await store.togglePlay();

    expect(fakeAudio.addEventListener).toHaveBeenCalledTimes(4);
    expect(fakeAudio.addEventListener).toHaveBeenCalledWith("loadedmetadata", expect.any(Function));
    expect(fakeAudio.addEventListener).toHaveBeenCalledWith("timeupdate", expect.any(Function));
    expect(fakeAudio.addEventListener).toHaveBeenCalledWith("ended", expect.any(Function));
    expect(fakeAudio.addEventListener).toHaveBeenCalledWith("error", expect.any(Function));
  });
});
