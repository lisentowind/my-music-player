export interface AudioLike {
  src: string;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  paused: boolean;
  error: MediaError | { message?: string } | null;
  play: () => Promise<void>;
  pause: () => void;
  load: () => void;
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
}

type AudioFactory = () => AudioLike;
type EventName = "loadedmetadata" | "timeupdate" | "ended" | "error";
type NormalizedEventListener = (event: Event) => void;

interface HowlLike {
  state: () => string;
  load: () => void;
  unload: () => void;
  play: () => number;
  pause: () => void;
  duration: () => number;
  seek: (time?: number) => number;
  volume: (volume?: number) => number;
  mute: (muted?: boolean) => boolean;
  playing: () => boolean;
  on: (event: string, handler: (...args: unknown[]) => void) => HowlLike;
  off: (event: string, handler?: (...args: unknown[]) => void) => HowlLike;
}

interface HowlConstructor {
  new(options: {
    src: string[];
    html5: boolean;
    preload: boolean;
    volume: number;
    mute: boolean;
  }): HowlLike;
}

interface HowlerModule {
  Howl: HowlConstructor;
}

type HowlerModuleLoader = () => Promise<HowlerModule>;

const defaultHowlerModuleLoader: HowlerModuleLoader = async () => {
  const howlerImportPath = "howler";
  const module = await import(/* @vite-ignore */ howlerImportPath);
  return module as unknown as HowlerModule;
};

let currentHowlerModuleLoader = defaultHowlerModuleLoader;

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  return "播放失败，请稍后重试。";
}

function normalizeEventListener(listener: EventListenerOrEventListenerObject): NormalizedEventListener {
  return typeof listener === "function"
    ? listener
    : (event: Event) => listener.handleEvent(event);
}

class HowlerPlayerAudio implements AudioLike {
  private _src = "";
  private _currentTime = 0;
  private _duration = 0;
  private _volume = 1;
  private _muted = false;
  paused = true;
  error: { message?: string } | null = null;

  private howl: HowlLike | null = null;
  private listeners = new Map<EventName, Set<NormalizedEventListener>>();
  private listenerMap = new Map<EventName, Map<EventListenerOrEventListenerObject, NormalizedEventListener>>();
  private timeUpdateTimer: ReturnType<typeof setInterval> | null = null;

  private readonly onLoad = () => {
    if (!this.howl) {
      return;
    }

    this._duration = this.howl.duration();
    this.emit("loadedmetadata");
  };

  private readonly onPlay = () => {
    this.paused = false;
    this.startTimeUpdateTicker();
  };

  private readonly onPause = () => {
    this.paused = true;
    this.stopTimeUpdateTicker();
  };

  private readonly onSeek = () => {
    if (!this.howl) {
      return;
    }

    this._currentTime = this.howl.seek();
    this.emit("timeupdate");
  };

  private readonly onEnd = () => {
    if (!this.howl) {
      return;
    }

    this.paused = true;
    this.stopTimeUpdateTicker();
    this._currentTime = this.howl.duration();
    this.emit("timeupdate");
    this.emit("ended");
  };

  private readonly onLoadError = (_id: unknown, error: unknown) => {
    this.paused = true;
    this.stopTimeUpdateTicker();
    this.error = { message: toErrorMessage(error) };
    this.emit("error");
  };

  private readonly onPlayError = (_id: unknown, error: unknown) => {
    this.paused = true;
    this.stopTimeUpdateTicker();
    this.error = { message: toErrorMessage(error) };
    this.emit("error");
  };

  async play() {
    await this.ensureHowl();
    if (!this.howl) {
      const playbackError = new Error("播放器未初始化");
      this.error = { message: playbackError.message };
      throw playbackError;
    }

    this.error = null;

    try {
      this.howl.play();
      this.paused = false;
      this.startTimeUpdateTicker();
    } catch (error) {
      this.paused = true;
      this.stopTimeUpdateTicker();
      this.error = { message: toErrorMessage(error) };
      throw error;
    }
  }

  pause() {
    this.howl?.pause();
    this.paused = true;
    this.stopTimeUpdateTicker();
  }

  load() {
    void this.ensureHowl();
  }

  get src() {
    return this._src;
  }

  set src(value: string) {
    if (this._src === value) {
      return;
    }

    this._src = value;
    this.disposeHowl();
    this._currentTime = 0;
    this._duration = 0;
  }

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(value: number) {
    this._currentTime = Number.isFinite(value) && value >= 0 ? value : 0;
    this.howl?.seek(this._currentTime);
  }

  get duration() {
    return this._duration;
  }

  set duration(value: number) {
    this._duration = Number.isFinite(value) && value >= 0 ? value : 0;
  }

  get volume() {
    return this._volume;
  }

  set volume(value: number) {
    const safeVolume = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
    this._volume = safeVolume;
    this.howl?.volume(safeVolume);
  }

  get muted() {
    return this._muted;
  }

  set muted(value: boolean) {
    this._muted = Boolean(value);
    this.howl?.mute(this._muted);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (!this.isEventName(type)) {
      return;
    }

    const normalized = normalizeEventListener(listener);
    const mappings = this.listenerMap.get(type) ?? new Map<EventListenerOrEventListenerObject, NormalizedEventListener>();
    mappings.set(listener, normalized);
    this.listenerMap.set(type, mappings);

    const eventListeners = this.listeners.get(type) ?? new Set<NormalizedEventListener>();
    eventListeners.add(normalized);
    this.listeners.set(type, eventListeners);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (!this.isEventName(type)) {
      return;
    }

    const mappings = this.listenerMap.get(type);
    const normalized = mappings?.get(listener);
    if (!normalized) {
      return;
    }

    mappings?.delete(listener);
    if (mappings && mappings.size === 0) {
      this.listenerMap.delete(type);
    }

    const eventListeners = this.listeners.get(type);
    if (!eventListeners) {
      return;
    }

    eventListeners.delete(normalized);
    if (eventListeners.size === 0) {
      this.listeners.delete(type);
    }
  }

  async ensureHowl() {
    if (!this.src) {
      return;
    }

    if (this.howl) {
      return;
    }

    const { Howl } = await currentHowlerModuleLoader();
    const howl = new Howl({
      src: [this.src],
      html5: true,
      preload: true,
      volume: this._volume,
      mute: this._muted,
    });
    howl.on("load", this.onLoad);
    howl.on("play", this.onPlay);
    howl.on("pause", this.onPause);
    howl.on("stop", this.onPause);
    howl.on("seek", this.onSeek);
    howl.on("end", this.onEnd);
    howl.on("loaderror", this.onLoadError);
    howl.on("playerror", this.onPlayError);
    this.howl = howl;
    this._duration = 0;
    this._currentTime = 0;
    this.paused = !howl.playing();
    howl.load();
  }

  private startTimeUpdateTicker() {
    if (this.timeUpdateTimer) {
      return;
    }

    this.timeUpdateTimer = setInterval(() => {
      if (!this.howl || this.paused) {
        return;
      }

      this._currentTime = this.howl.seek();
      this.emit("timeupdate");
    }, 250);
  }

  private stopTimeUpdateTicker() {
    if (!this.timeUpdateTimer) {
      return;
    }

    clearInterval(this.timeUpdateTimer);
    this.timeUpdateTimer = null;
  }

  private emit(type: EventName) {
    const event = new Event(type);
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }

  private isEventName(type: string): type is EventName {
    return type === "loadedmetadata" || type === "timeupdate" || type === "ended" || type === "error";
  }

  private disposeHowl() {
    if (!this.howl) {
      return;
    }

    this.stopTimeUpdateTicker();
    this.howl.off("load", this.onLoad);
    this.howl.off("play", this.onPlay);
    this.howl.off("pause", this.onPause);
    this.howl.off("stop", this.onPause);
    this.howl.off("seek", this.onSeek);
    this.howl.off("end", this.onEnd);
    this.howl.off("loaderror", this.onLoadError);
    this.howl.off("playerror", this.onPlayError);
    this.howl.unload();
    this.howl = null;
    this.paused = true;
  }
}

const defaultFactory: AudioFactory = () => new HowlerPlayerAudio();

let currentFactory: AudioFactory = defaultFactory;

export function createPlayerAudio() {
  return currentFactory();
}

export function configurePlayerAudioFactory(factory: AudioFactory) {
  currentFactory = factory;
}

export function createHowlerPlayerAudio() {
  return new HowlerPlayerAudio();
}

export function configurePlayerHowlerLoader(loader: HowlerModuleLoader) {
  currentHowlerModuleLoader = loader;
}
