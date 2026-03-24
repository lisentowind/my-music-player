import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { featuredAlbums, getTracksByIds, tracks } from "@/data/music-library";

type AudioEventListener = (event: Event) => void;

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

class FakePlayerAudio {
  src = "";
  currentTime = 0;
  duration = 0;
  volume = 1;
  muted = false;
  paused = true;
  error: { message?: string } | null = null;
  private listeners = new Map<string, Set<AudioEventListener>>();
  private listenerMap = new Map<string, Map<EventListenerOrEventListenerObject, AudioEventListener>>();

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
    const mappings = this.listenerMap.get(type) ?? new Map<EventListenerOrEventListenerObject, AudioEventListener>();
    mappings.set(listener, normalized);
    this.listenerMap.set(type, mappings);

    const group = this.listeners.get(type) ?? new Set<AudioEventListener>();
    group.add(normalized);
    this.listeners.set(type, group);
  });

  removeEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
    const mappings = this.listenerMap.get(type);
    const normalized = mappings?.get(listener);
    if (!normalized) {
      return;
    }

    mappings?.delete(listener);
    if (mappings && mappings.size === 0) {
      this.listenerMap.delete(type);
    }

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

  it("playContext 目标不存在时保持 queue/currentIndex/isPlaying 不变", async () => {
    const store = usePlayerStore();
    await store.playTrackById(tracks[2].id);

    const originalQueue = store.queue.map(track => track.id);
    const originalIndex = store.currentIndex;
    const originalTrackId = store.currentTrack?.id;
    const originalPlaying = store.isPlaying;
    const originalSrc = fakeAudio.src;

    await store.playContext([tracks[4], tracks[5]], "missing-track-id");

    expect(store.queue.map(track => track.id)).toEqual(originalQueue);
    expect(store.currentIndex).toBe(originalIndex);
    expect(store.currentTrack?.id).toBe(originalTrackId);
    expect(store.isPlaying).toBe(originalPlaying);
    expect(fakeAudio.src).toBe(originalSrc);
  });

  it("先进入专辑上下文后，playTrackById 命中队列外歌曲会回退到全局并播放目标曲目", async () => {
    const store = usePlayerStore();
    const albumTracks = getTracksByIds(featuredAlbums[0]!.trackIds);
    await store.playContext(albumTracks, "track-dawn-echo");
    expect(store.queue.map(track => track.id)).toEqual(featuredAlbums[0]!.trackIds);

    await store.playTrackById("track-orbit-glow");

    expect(store.queue.map(track => track.id)).toEqual(tracks.map(track => track.id));
    expect(store.currentTrack?.id).toBe("track-orbit-glow");
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

  it("多 store 实例不会重复绑定事件，也不会覆盖前一个实例的生命周期同步", async () => {
    const firstStore = usePlayerStore();
    await firstStore.playTrackById(tracks[0].id);

    const secondPinia = createPinia();
    const secondStore = usePlayerStore(secondPinia);

    fakeAudio.currentTime = 21;
    fakeAudio.emit("timeupdate");

    expect(firstStore.currentTime).toBe(21);
    expect(secondStore.currentTime).toBe(21);

    expect(fakeAudio.addEventListener).toHaveBeenCalledTimes(4);
    expect(fakeAudio.addEventListener).toHaveBeenCalledWith("loadedmetadata", expect.any(Function));
    expect(fakeAudio.addEventListener).toHaveBeenCalledWith("timeupdate", expect.any(Function));
    expect(fakeAudio.addEventListener).toHaveBeenCalledWith("ended", expect.any(Function));
    expect(fakeAudio.addEventListener).toHaveBeenCalledWith("error", expect.any(Function));

    firstStore.$dispose();
    expect(fakeAudio.removeEventListener).toHaveBeenCalledTimes(0);

    secondStore.$dispose();
    expect(fakeAudio.removeEventListener).toHaveBeenCalledTimes(4);
  });

  it("ended 异步流程过期后不会覆盖用户后续操作", async () => {
    const store = usePlayerStore();
    const delayedPlay = createDeferred<void>();
    let playCallCount = 0;
    fakeAudio.play.mockImplementation(async () => {
      playCallCount += 1;
      fakeAudio.paused = false;
      if (playCallCount === 2) {
        await delayedPlay.promise;
      }
    });

    await store.playTrackById(tracks[0].id);
    fakeAudio.emit("ended");
    await store.playTrackById(tracks[5].id);
    await store.togglePlay();
    expect(store.isPlaying).toBe(false);

    delayedPlay.resolve();
    await delayedPlay.promise;
    await Promise.resolve();

    expect(store.currentTrack?.id).toBe(tracks[5].id);
    expect(store.isPlaying).toBe(false);
  });

  it("error 异步恢复流程过期后不会冲掉最新手动状态", async () => {
    const store = usePlayerStore();
    const delayedRecoveryPlay = createDeferred<void>();
    let playCallCount = 0;
    fakeAudio.play.mockImplementation(async () => {
      playCallCount += 1;
      fakeAudio.paused = false;
      if (playCallCount === 2) {
        await delayedRecoveryPlay.promise;
      }
    });

    await store.playTrackById(tracks[0].id);
    fakeAudio.error = { message: "decode failed" };
    fakeAudio.emit("error");
    await store.playTrackById(tracks[4].id);
    await store.togglePlay();
    expect(store.isPlaying).toBe(false);

    delayedRecoveryPlay.resolve();
    await delayedRecoveryPlay.promise;
    await Promise.resolve();

    expect(store.currentTrack?.id).toBe(tracks[4].id);
    expect(store.isPlaying).toBe(false);
  });

  it("recentTrackCount 统计会话内最近播放的不同歌曲数量", async () => {
    const store = usePlayerStore();

    await store.playTrackById("track-dawn-echo");
    await store.playTrackById("track-orbit-glow");
    await store.playTrackById("track-dawn-echo");

    expect(store.recentPlayIds).toEqual(["track-dawn-echo", "track-orbit-glow"]);
    expect(store.recentTrackCount).toBe(2);
  });

  it("favoriteMoodTags 在无 recent 时使用 liked 源进行聚合", () => {
    const store = usePlayerStore();

    expect(store.recentPlayIds).toEqual([]);
    expect(store.favoriteMoodTags).toContain("清透");
    expect(store.favoriteMoodTags).not.toContain("克制");
  });

  it("favoriteMoodTags 会合并 recent 与 liked 源", async () => {
    const store = usePlayerStore();

    await store.playTrackById("track-glacier-pulse");

    expect(store.favoriteMoodTags).toContain("克制");
    expect(store.favoriteMoodTags).toContain("清透");
  });
});
