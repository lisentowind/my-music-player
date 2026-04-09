import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlayerDock from "@/components/dock/PlayerDock.vue";

class FakePlayerAudio {
  src = "";
  currentTime = 0;
  duration = 0;
  volume = 1;
  muted = false;
  paused = true;
  error: { message?: string } | null = null;
  private listeners = new Map<string, Set<(event: Event) => void>>();
  private listenerMap = new Map<string, Map<EventListenerOrEventListenerObject, (event: Event) => void>>();

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
    const mappings = this.listenerMap.get(type) ?? new Map<EventListenerOrEventListenerObject, (event: Event) => void>();
    mappings.set(listener, normalized);
    this.listenerMap.set(type, mappings);

    const group = this.listeners.get(type) ?? new Set<(event: Event) => void>();
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

  emit(type: string) {
    const event = new Event(type);
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe("player dock", () => {
  beforeEach(async () => {
    vi.resetModules();
    setActivePinia(createPinia());

    const fakeAudio = new FakePlayerAudio();
    const { configurePlayerAudioFactory } = await import("@/lib/player/audio");
    configurePlayerAudioFactory(() => fakeAudio);
  });

  it("显示当前曲目信息", async () => {
    const pinia = createPinia();
    const wrapper = mount(PlayerDock, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.get('[data-testid="player-dock-title"]').text()).toBe("晨雾回声");
    expect(wrapper.get('[data-testid="player-dock-artist"]').text()).toContain("北纬合成社");
    expect(wrapper.find('[data-testid="player-dock-shell"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="player-dock-transport"]').exists()).toBe(true);
  });

  it("点击播放/暂停按钮会切换 player.isPlaying", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const player = usePlayerStore(pinia);
    const wrapper = mount(PlayerDock, {
      global: {
        plugins: [pinia],
      },
    });

    expect(player.isPlaying).toBe(false);

    await wrapper.get('[data-testid="player-dock-toggle"]').trigger("click");
    await flushPromises();
    expect(player.isPlaying).toBe(true);

    await wrapper.get('[data-testid="player-dock-toggle"]').trigger("click");
    await flushPromises();
    expect(player.isPlaying).toBe(false);
  });

  it("点击上一首/下一首会切换当前曲目", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const player = usePlayerStore(pinia);
    const wrapper = mount(PlayerDock, {
      global: {
        plugins: [pinia],
      },
    });

    const initialTrackId = player.currentTrack?.id;
    const initialIndex = player.currentIndex;

    await wrapper.get('[data-testid="player-dock-next"]').trigger("click");
    await flushPromises();
    expect(player.currentIndex).toBe(initialIndex + 1);
    expect(player.currentTrack?.id).not.toBe(initialTrackId);

    await wrapper.get('[data-testid="player-dock-prev"]').trigger("click");
    await flushPromises();
    expect(player.currentIndex).toBe(initialIndex);
    expect(player.currentTrack?.id).toBe(initialTrackId);
  });

  it("点击模式按钮会循环切换播放模式", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const player = usePlayerStore(pinia);
    const wrapper = mount(PlayerDock, {
      global: {
        plugins: [pinia],
      },
    });

    expect(player.activeModeLabel).toBe("顺序播放");
    expect(wrapper.get('[data-testid="player-dock-mode-label"]').text()).toBe("顺序播放");

    await wrapper.get('[data-testid="player-dock-mode"]').trigger("click");
    await flushPromises();
    expect(player.activeModeLabel).toBe("随机播放");
    expect(wrapper.get('[data-testid="player-dock-mode-label"]').text()).toBe("随机播放");

    await wrapper.get('[data-testid="player-dock-mode"]').trigger("click");
    await flushPromises();
    expect(player.activeModeLabel).toBe("单曲循环");

    await wrapper.get('[data-testid="player-dock-mode"]').trigger("click");
    await flushPromises();
    expect(player.activeModeLabel).toBe("顺序播放");
  });

  it("拖动进度条会触发 seek 并更新 currentTime", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const player = usePlayerStore(pinia);
    await player.playTrackById("track-dawn-echo");
    player.duration = 180;

    const wrapper = mount(PlayerDock, {
      global: {
        plugins: [pinia],
      },
    });

    const progress = wrapper.get('[data-testid="player-dock-progress"]');
    expect(progress.attributes("disabled")).toBeUndefined();
    expect(wrapper.find('[data-testid="player-dock-progress-rail"]').exists()).toBe(true);

    await progress.setValue("42.5");
    expect(player.currentTime).toBe(42.5);
  });

  it("拖动音量滑块会调用 setVolume 并更新音量", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const player = usePlayerStore(pinia);
    const wrapper = mount(PlayerDock, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.find('[data-testid="player-dock-volume-rail"]').exists()).toBe(true);
    await wrapper.get('[data-testid="player-dock-volume"]').setValue("0.35");

    expect(player.volume).toBeCloseTo(0.35);
  });

  it("点击静音按钮会切换 muted 状态", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const player = usePlayerStore(pinia);
    const wrapper = mount(PlayerDock, {
      global: {
        plugins: [pinia],
      },
    });

    expect(player.muted).toBe(false);

    await wrapper.get('[data-testid="player-dock-mute"]').trigger("click");
    expect(player.muted).toBe(true);

    await wrapper.get('[data-testid="player-dock-mute"]').trigger("click");
    expect(player.muted).toBe(false);
  });

  it("出现播放错误时会展示错误提示文案", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const player = usePlayerStore(pinia);
    await player.playTrackById("track-dawn-echo");

    const wrapper = mount(PlayerDock, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.find(".player-dock__error").exists()).toBe(false);

    player.errorTrackId = "track-dawn-echo";
    player.errorMessage = "decode failed";
    await flushPromises();

    const error = wrapper.get(".player-dock__error");
    expect(error.text()).toContain("播放失败：decode failed");
  });
});
