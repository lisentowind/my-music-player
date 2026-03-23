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

const defaultFactory: AudioFactory = () => new Audio() as AudioLike;

let currentFactory: AudioFactory = defaultFactory;

export function createPlayerAudio() {
  return currentFactory();
}

export function configurePlayerAudioFactory(factory: AudioFactory) {
  currentFactory = factory;
}
