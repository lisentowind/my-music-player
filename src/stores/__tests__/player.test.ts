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

type HowlEventName = "load" | "play" | "pause" | "stop" | "end" | "seek" | "loaderror" | "playerror";
type HowlEventListener = (...args: unknown[]) => void;

class FakeHowl {
  private events: Record<HowlEventName, HowlEventListener[]> = {
    load: [],
    play: [],
    pause: [],
    stop: [],
    end: [],
    seek: [],
    loaderror: [],
    playerror: [],
  };
  private _seek = 0;
  private _duration = 0;
  private _volume = 1;
  private _mute = false;

  state = vi.fn(() => "loaded");
  playing = vi.fn(() => false);
  load = vi.fn(() => this.emit("load"));
  unload = vi.fn(() => {});
  duration = vi.fn(() => this._duration);
  seek = vi.fn((value?: number) => {
    if (typeof value === "number") {
      this._seek = value;
      this.emit("seek");
    }

    return this._seek;
  });
  volume = vi.fn((value?: number) => {
    if (typeof value === "number") {
      this._volume = value;
    }

    return this._volume;
  });
  mute = vi.fn((value?: boolean) => {
    if (typeof value === "boolean") {
      this._mute = value;
    }

    return this._mute;
  });
  play = vi.fn(() => {
    this.emit("play");
    return 1;
  });
  pause = vi.fn(() => {
    this.emit("pause");
  });
  once = vi.fn((event: HowlEventName, listener: HowlEventListener) => {
    const onceListener = (...args: unknown[]) => {
      this.off(event, onceListener);
      listener(...args);
    };
    this.on(event, onceListener);
    return this;
  });
  on = vi.fn((event: HowlEventName, listener: HowlEventListener) => {
    this.events[event].push(listener);
    return this;
  });
  off = vi.fn((event: HowlEventName, listener?: HowlEventListener) => {
    if (!listener) {
      this.events[event] = [];
      return this;
    }

    this.events[event] = this.events[event].filter(candidate => candidate !== listener);
    return this;
  });

  setDuration(value: number) {
    this._duration = value;
  }

  setSeek(value: number) {
    this._seek = value;
  }

  emit(event: HowlEventName, ...args: unknown[]) {
    for (const listener of [...this.events[event]]) {
      listener(...args);
    }
  }
}

describe("usePlayerStore", () => {
  let usePlayerStore: PlayerStoreModule["usePlayerStore"];
  let configurePlayerAudioFactory: PlayerAudioModule["configurePlayerAudioFactory"];
  let fakeAudio: FakePlayerAudio;

  beforeEach(async () => {
    vi.resetModules();
    window.localStorage.clear();
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
    expect(fakeAudio.src).toBe(tracks[0]!.audioSrc);
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

  it("shuffle 模式下重新进入同一逻辑队列时，下一首顺序保持稳定", async () => {
    const store = usePlayerStore();
    const currentTrackId = tracks[2]!.id;

    store.cycleMode();
    store.cycleMode();
    await store.playContext([...tracks], currentTrackId);
    await store.playNext();
    const firstNextTrackId = store.currentTrack?.id;

    await store.playContext([...tracks], currentTrackId);
    await store.playNext();

    expect(store.currentTrack?.id).toBe(firstNextTrackId);
  });

  it("shuffle 模式下连续 playNext 可以走完整个队列", async () => {
    const store = usePlayerStore();
    const currentTrackId = tracks[2]!.id;
    const visitedTrackIds = new Set<string>();

    store.cycleMode();
    store.cycleMode();
    await store.playContext([...tracks], currentTrackId);
    visitedTrackIds.add(store.currentTrack!.id);

    for (let step = 0; step < tracks.length + 1; step += 1) {
      await store.playNext();
      if (store.currentTrack) {
        visitedTrackIds.add(store.currentTrack.id);
      }
      if (!store.isPlaying) {
        break;
      }
    }

    expect(visitedTrackIds).toEqual(new Set(tracks.map(track => track.id)));
  });

  it("相同 trackIds 在 global 与 context 队列来源下会生成不同的 shuffle key", async () => {
    const store = usePlayerStore();
    const currentTrackId = tracks[2]!.id;

    store.cycleMode();
    store.cycleMode();
    await store.playTrackById(currentTrackId);
    await store.playNext();
    const globalNextTrackId = store.currentTrack?.id;

    await store.playContext([...tracks], currentTrackId);
    await store.playNext();

    expect(store.queueSource.kind).toBe("context");
    expect(store.currentTrack?.id).not.toBe(globalNextTrackId);
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

  it("创建 store 时会同步共享 audio 的当前时间、时长、音量和静音状态", () => {
    fakeAudio.src = tracks[0]!.audioSrc;
    fakeAudio.currentTime = 18;
    fakeAudio.duration = 120;
    fakeAudio.volume = 0.48;
    fakeAudio.muted = true;

    const store = usePlayerStore();

    expect(store.currentTime).toBe(18);
    expect(store.duration).toBe(120);
    expect(store.volume).toBe(0.48);
    expect(store.muted).toBe(true);
    expect(fakeAudio.volume).toBe(0.48);
    expect(fakeAudio.muted).toBe(true);
  });

  it("真实时长未返回前优先展示曲目静态时长，返回后允许运行时回填", async () => {
    const store = usePlayerStore();

    await store.playTrackById("track-dawn-echo");

    expect(store.duration).toBe(0);
    expect(store.durationLabel).toBe(tracks[0]!.durationLabel);

    fakeAudio.duration = 96;
    fakeAudio.emit("loadedmetadata");

    expect(store.duration).toBe(96);
    expect(store.durationLabel).toBe("1:36");
  });

  it("队列来源变更时会重建 queueSource 与 upcomingTracks 视图", async () => {
    const store = usePlayerStore();
    const albumTracks = getTracksByIds(featuredAlbums[0]!.trackIds);

    expect(store.queueSource.kind).toBe("global");
    expect(store.upcomingTracks.length).toBeGreaterThan(0);

    await store.playContext(albumTracks, albumTracks[0]!.id);

    expect(store.queueSource.kind).toBe("context");
    expect(store.queueSource.trackIds).toEqual(albumTracks.map(track => track.id));
    expect(store.upcomingTracks.map(track => track.id)).toEqual(albumTracks.slice(1).map(track => track.id));
  });

  it("setVolume 与 toggleMute 会同步到底层 audio 适配实例", () => {
    const store = usePlayerStore();

    store.setVolume(0.35);
    expect(store.volume).toBe(0.35);
    expect(fakeAudio.volume).toBe(0.35);

    store.toggleMute();
    expect(store.muted).toBe(true);
    expect(fakeAudio.muted).toBe(true);
  });

  it("底层 play promise reject 时会记录错误并保持暂停", async () => {
    const store = usePlayerStore();
    fakeAudio.play.mockRejectedValueOnce(new Error("autoplay blocked"));

    await store.playTrackById(tracks[0].id);

    expect(store.isPlaying).toBe(false);
    expect(store.errorTrackId).toBe(tracks[0].id);
    expect(store.errorMessage).toContain("autoplay blocked");
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

  it("后创建的 store 不会重置共享 audio 的音量和静音状态", () => {
    const firstStore = usePlayerStore();
    firstStore.setVolume(0.25);
    firstStore.toggleMute();

    const secondPinia = createPinia();
    const secondStore = usePlayerStore(secondPinia);

    expect(fakeAudio.volume).toBe(0.25);
    expect(fakeAudio.muted).toBe(true);
    expect(secondStore.volume).toBe(0.25);
    expect(secondStore.muted).toBe(true);
  });

  it("会记住播放模式、音量和静音状态，并在新会话里恢复", async () => {
    const firstStore = usePlayerStore();

    firstStore.cycleMode();
    firstStore.cycleMode();
    firstStore.setVolume(0.33);
    firstStore.toggleMute();

    const persisted = JSON.parse(window.localStorage.getItem("aura-player-playback-preferences") ?? "{}") as {
      mode?: string;
      volume?: number;
      muted?: boolean;
    };

    expect(persisted).toEqual({
      mode: "shuffle",
      volume: 0.33,
      muted: true,
    });

    vi.resetModules();
    setActivePinia(createPinia());

    const restoredAudio = new FakePlayerAudio();
    const { configurePlayerAudioFactory: configureRestoredAudioFactory } = await import("@/lib/player/audio");
    configureRestoredAudioFactory(() => restoredAudio);
    const { usePlayerStore: useRestoredPlayerStore } = await import("@/stores/player");
    const restoredStore = useRestoredPlayerStore();

    expect(restoredStore.mode).toBe("shuffle");
    expect(restoredStore.volume).toBe(0.33);
    expect(restoredStore.muted).toBe(true);
    expect(restoredAudio.volume).toBe(0.33);
    expect(restoredAudio.muted).toBe(true);
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

  it("收藏状态只在当前会话内同步，不会泄露到新 store", () => {
    const firstStore = usePlayerStore();
    firstStore.toggleLike("track-dawn-echo");

    expect(firstStore.likedTrackIdList).not.toContain("track-dawn-echo");

    const secondPinia = createPinia();
    const secondStore = usePlayerStore(secondPinia);

    expect(secondStore.likedTrackIdList).toContain("track-dawn-echo");
  });
});

describe("howler player adapter", () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it("会把 howler 事件桥接为 loadedmetadata/timeupdate/ended/error", async () => {
    let howlInstance: FakeHowl | null = null;
    const { configurePlayerHowlerLoader, createHowlerPlayerAudio } = await import("@/lib/player/audio");
    configurePlayerHowlerLoader(async () => ({
      Howl: class {
        constructor() {
          howlInstance = new FakeHowl();
          return howlInstance;
        }
      } as never,
    }));

    const audio = createHowlerPlayerAudio();
    const loadedmetadata = vi.fn();
    const timeupdate = vi.fn();
    const ended = vi.fn();
    const onError = vi.fn();
    audio.addEventListener("loadedmetadata", loadedmetadata);
    audio.addEventListener("timeupdate", timeupdate);
    audio.addEventListener("ended", ended);
    audio.addEventListener("error", onError);

    const nextDuration = 126;
    audio.src = tracks[0]!.audioSrc;
    audio.load();
    await Promise.resolve();
    expect(howlInstance).not.toBeNull();

    howlInstance!.setDuration(nextDuration);
    howlInstance!.emit("load");
    expect(audio.duration).toBe(nextDuration);
    expect(loadedmetadata).toHaveBeenCalledTimes(2);

    howlInstance!.setSeek(33);
    howlInstance!.emit("seek");
    expect(audio.currentTime).toBe(33);
    expect(timeupdate).toHaveBeenCalledTimes(1);

    howlInstance!.setSeek(126);
    howlInstance!.emit("end");
    expect(audio.currentTime).toBe(126);
    expect(ended).toHaveBeenCalledTimes(1);

    howlInstance!.emit("playerror", 1, "decode failed");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(audio.error).toEqual({ message: "decode failed" });
  });

  it("volume/muted/currentTime set 操作会透传给 howl 实例", async () => {
    let howlInstance: FakeHowl | null = null;
    const { configurePlayerHowlerLoader, createHowlerPlayerAudio } = await import("@/lib/player/audio");
    configurePlayerHowlerLoader(async () => ({
      Howl: class {
        constructor() {
          howlInstance = new FakeHowl();
          return howlInstance;
        }
      } as never,
    }));

    const audio = createHowlerPlayerAudio();
    audio.src = tracks[0]!.audioSrc;
    audio.load();
    await Promise.resolve();

    audio.volume = 0.42;
    expect(howlInstance!.volume).toHaveBeenCalledWith(0.42);

    audio.muted = true;
    expect(howlInstance!.mute).toHaveBeenCalledWith(true);

    audio.currentTime = 17;
    expect(howlInstance!.seek).toHaveBeenCalledWith(17);
    expect(audio.currentTime).toBe(17);
  });
});
