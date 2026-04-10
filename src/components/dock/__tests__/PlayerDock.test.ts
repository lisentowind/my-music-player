import { flushPromises, mount } from "@vue/test-utils";
import { readFileSync } from "node:fs";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PlayerDock from "@/components/dock/PlayerDock.vue";
import { routes } from "@/router/routes";

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
  const mountedWrappers: Array<{ unmount: () => void }> = [];

  async function mountDock(path = "/") {
    const pinia = createPinia();
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
    const { usePlayerStore } = await import("@/stores/player");
    const player = usePlayerStore(pinia);

    await router.push(path);
    await router.isReady();
    await player.playTrackById("track-dawn-echo");
    await flushPromises();
    if (player.isPlaying) {
      await player.togglePlay();
    }
    player.mode = "sequential";
    player.seekTo(0);
    player.setVolume(1);
    if (player.muted) {
      player.toggleMute();
    }
    player.clearPlaybackError();

    const wrapper = mount(PlayerDock, {
      attachTo: document.body,
      global: {
        plugins: [pinia, router],
      },
    });

    mountedWrappers.push(wrapper);

    return { wrapper, pinia, router };
  }

  beforeEach(async () => {
    vi.resetModules();
    setActivePinia(createPinia());

    const fakeAudio = new FakePlayerAudio();
    const { configurePlayerAudioFactory } = await import("@/lib/player/audio");
    configurePlayerAudioFactory(() => fakeAudio);
  });

  afterEach(() => {
    while (mountedWrappers.length > 0) {
      const wrapper = mountedWrappers.pop();
      wrapper?.unmount();
    }

    document.body.innerHTML = "";
  });

  it("显示当前曲目信息", async () => {
    const { wrapper } = await mountDock();

    expect(wrapper.get('[data-testid="player-dock-title"]').text()).toBe("晨雾回声");
    expect(wrapper.get('[data-testid="player-dock-artist"]').text()).toContain("北纬合成社");
    expect(wrapper.find('[data-testid="player-dock-shell"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="player-dock-shell"]').attributes("data-dock-layout")).toBe("single-row");
    expect(wrapper.get('[data-testid="player-dock-shell"]').attributes("data-dock-density")).toBe("compact");
    expect(wrapper.get('[data-testid="player-dock-shell"]').attributes("data-dock-min-width")).toBe("880");
    expect(wrapper.get('[data-testid="player-dock-shell"]').attributes("data-dock-min-height")).toBe("76");
    expect(wrapper.get('[data-testid="player-dock-shell"]').attributes("data-dock-span")).toBe("content-pane");
    expect(wrapper.get('[data-testid="player-dock-shell"]').attributes("data-dock-anchor")).toBe("content-pane");
    expect(wrapper.find('[data-testid="player-dock-transport"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain("当前播放");
    expect(wrapper.text()).not.toContain("Mode");
  });

  it("点击播放/暂停按钮会切换 player.isPlaying", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountDock();
    const player = usePlayerStore(pinia);

    expect(player.isPlaying).toBe(false);

    await wrapper.get('[data-testid="player-dock-toggle"]').trigger("click");
    await flushPromises();
    expect(player.isPlaying).toBe(true);

    await wrapper.get('[data-testid="player-dock-toggle"]').trigger("click");
    await flushPromises();
    expect(player.isPlaying).toBe(false);
  });

  it("点击上一首/下一首会切换当前曲目", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountDock();
    const player = usePlayerStore(pinia);

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
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountDock();
    const player = usePlayerStore(pinia);

    expect(player.activeModeLabel).toBe("顺序播放");
    expect(wrapper.get('[data-testid="player-dock-mode-label"]').text()).toBe("顺序播放");

    await wrapper.get('[data-testid="player-dock-mode"]').trigger("click");
    await flushPromises();
    expect(player.activeModeLabel).toBe("单曲循环");
    expect(wrapper.get('[data-testid="player-dock-mode-label"]').text()).toBe("单曲循环");

    await wrapper.get('[data-testid="player-dock-mode"]').trigger("click");
    await flushPromises();
    expect(player.activeModeLabel).toBe("随机播放");

    await wrapper.get('[data-testid="player-dock-mode"]').trigger("click");
    await flushPromises();
    expect(player.activeModeLabel).toBe("顺序播放");
  });

  it("拖动进度条会触发 seek 并更新 currentTime", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountDock();
    const player = usePlayerStore(pinia);
    await player.playTrackById("track-dawn-echo");
    player.duration = 180;
    await flushPromises();

    const progress = wrapper.get('[data-testid="player-dock-progress"]');
    expect(progress.attributes("disabled")).toBeUndefined();
    expect(wrapper.find('[data-testid="player-dock-progress-rail"]').exists()).toBe(true);

    await progress.setValue("42.5");
    expect(player.currentTime).toBe(42.5);
  });

  it("拖动音量滑块会调用 setVolume 并更新音量", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountDock();
    const player = usePlayerStore(pinia);

    expect(wrapper.find('[data-testid="player-dock-volume-rail"]').exists()).toBe(true);
    await wrapper.get('[data-testid="player-dock-volume"]').setValue("0.35");

    expect(player.volume).toBeCloseTo(0.35);
  });

  it("点击静音按钮会切换 muted 状态", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountDock();
    const player = usePlayerStore(pinia);

    expect(player.muted).toBe(false);

    await wrapper.get('[data-testid="player-dock-mute"]').trigger("click");
    expect(player.muted).toBe(true);

    await wrapper.get('[data-testid="player-dock-mute"]').trigger("click");
    expect(player.muted).toBe(false);
  });

  it("出现播放错误时会展示错误提示文案", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountDock();
    const player = usePlayerStore(pinia);
    await player.playTrackById("track-dawn-echo");

    expect(wrapper.find(".player-dock__error").exists()).toBe(false);

    player.errorTrackId = "track-dawn-echo";
    player.errorMessage = "decode failed";
    await flushPromises();

    const error = wrapper.get(".player-dock__error");
    expect(error.text()).toContain("播放失败：decode failed");
  });

  it("队列入口会打开只读 upcoming 面板，并可点击切歌", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountDock();
    const player = usePlayerStore(pinia);
    const nextTrack = player.upcomingTracks[0];

    expect(nextTrack).toBeTruthy();
    expect(wrapper.find('[data-testid="player-dock-queue-popover"]').exists()).toBe(false);

    await wrapper.get('[data-testid="player-dock-queue-button"]').trigger("click");
    await flushPromises();

    expect(wrapper.get('[data-testid="player-dock-queue-popover"]').text()).toContain("当前播放曲目");
    expect(wrapper.get('[data-testid="player-dock-queue-button"]').attributes("aria-expanded")).toBe("true");
    expect(wrapper.get('[data-testid="queue-current-track"]').text()).toContain(player.currentTrack?.title ?? "");
    expect(wrapper.get('[data-testid="queue-total-count"]').text()).toContain(String(player.queue.length));

    await wrapper.get(`[data-testid="queue-track-item-${nextTrack!.id}"]`).trigger("click");
    await flushPromises();

    expect(player.currentTrack?.id).toBe(nextTrack!.id);
  });

  it("点击 Dock 封面会进入全屏播放器页面", async () => {
    const { wrapper, router } = await mountDock("/library");

    const coverButton = wrapper.get('[data-testid="player-dock-cover-button"]');
    expect(coverButton.attributes("aria-label")).toContain("进入全屏播放器");

    await coverButton.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/player");
    expect(sessionStorage.getItem("player-fullscreen-origin")).toBeTruthy();
  });

  it("Dock 源码支持从沉浸式页面返回时的封面对称过渡", async () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/components/dock/PlayerDock.vue", "utf-8");

    expect(source).toContain("PLAYER_FULLSCREEN_RETURN_KEY");
    expect(source).toContain("animateReturnFromPlayer");
    expect(source).toContain("gsap.set([surfaceElement, coverElement], { autoAlpha: 1, y: 0, scale: 1, filter: \"blur(0px)\" });");
  });

  it("Dock 宽度与顶部内容区保持同一左右基线", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/components/dock/PlayerDock.vue", "utf-8");

    expect(source).toContain("left: calc(var(--layout-sidebar-width) + (var(--layout-gap) * 3));");
    expect(source).toContain("right: var(--layout-gap);");
  });
});
