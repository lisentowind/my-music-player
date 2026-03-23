import { afterEach, beforeEach, vi } from "vitest";

type AudioListener = (event: Event) => void;

const originalAudio = globalThis.Audio;

function normalizeListener(listener: EventListenerOrEventListenerObject): AudioListener {
  if (typeof listener === "function") {
    return (event) => listener(event);
  }

  return (event) => listener.handleEvent(event);
}

export class FakeAudio {
  src = "";
  currentTime = 0;
  paused = true;
  private listeners = new Map<string, Set<AudioListener>>();
  private listenerMap = new Map<string, Map<EventListenerOrEventListenerObject, AudioListener>>();

  constructor(url?: string) {
    if (typeof url === "string") {
      this.src = url;
    }
  }

  play = vi.fn(async () => {
    this.paused = false;
  });

  pause = vi.fn(() => {
    this.paused = true;
  });

  load = vi.fn(() => {});

  addEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
    const mappedListeners = this.listenerMap.get(type) ?? new Map<EventListenerOrEventListenerObject, AudioListener>();
    const normalized = normalizeListener(listener);
    mappedListeners.set(listener, normalized);
    this.listenerMap.set(type, mappedListeners);

    const listeners = this.listeners.get(type) ?? new Set<AudioListener>();
    listeners.add(normalized);
    this.listeners.set(type, listeners);
  });

  removeEventListener = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
    const mappedListeners = this.listenerMap.get(type);
    const normalized = mappedListeners?.get(listener);
    if (!normalized) {
      return;
    }

    mappedListeners?.delete(listener);
    if (mappedListeners && mappedListeners.size === 0) {
      this.listenerMap.delete(type);
    }

    const listeners = this.listeners.get(type);
    if (!listeners) {
      return;
    }

    listeners.delete(normalized);
    if (listeners.size === 0) {
      this.listeners.delete(type);
    }
  });

  emit(type: string, event?: Event | Record<string, unknown>) {
    const listeners = this.listeners.get(type);
    if (!listeners || listeners.size === 0) {
      return;
    }

    let resolvedEvent: Event;
    if (event instanceof Event) {
      resolvedEvent = event;
    } else {
      resolvedEvent = new Event(type);
      if (event) {
        for (const [key, value] of Object.entries(event)) {
          if (key === "type") {
            continue;
          }

          Reflect.set(resolvedEvent as object, key, value);
        }
      }
    }

    for (const listener of listeners) {
      listener(resolvedEvent);
    }
  }
}

beforeEach(() => {
  globalThis.Audio = FakeAudio as unknown as typeof Audio;
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();

  if (originalAudio) {
    globalThis.Audio = originalAudio;
    return;
  }

  Reflect.deleteProperty(globalThis, "Audio");
});
