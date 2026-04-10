import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { gsapFromToMock, gsapToMock } = vi.hoisted(() => ({
  gsapFromToMock: vi.fn((_target: unknown, _from: unknown, to: { onComplete?: () => void }) => {
    to.onComplete?.();
    return { kill: vi.fn() };
  }),
  gsapToMock: vi.fn((_target: unknown, to: { onComplete?: () => void }) => {
    to.onComplete?.();
    return { kill: vi.fn() };
  }),
}));

vi.mock("howler", () => ({
  Howl: class {},
}));

vi.mock("gsap", () => ({
  gsap: {
    fromTo: gsapFromToMock,
    to: gsapToMock,
    registerPlugin: vi.fn(),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {},
}));

class FakePlayerAudio {
  src = "";
  currentTime = 0;
  duration = 0;
  volume = 1;
  muted = false;
  paused = true;
  error: { message?: string } | null = null;

  play = vi.fn(async () => {
    this.paused = false;
  });

  pause = vi.fn(() => {
    this.paused = true;
  });

  load = vi.fn(() => {});

  addEventListener = vi.fn(() => {});

  removeEventListener = vi.fn(() => {});
}

describe("player view", () => {
  const mountedWrappers: Array<{ unmount: () => void }> = [];

  async function mountPlayerShell(path = "/player") {
    const { routes } = await import("@/router/routes");
    const { default: AppShell } = await import("@/components/AppShell.vue");
    const pinia = createPinia();
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    await router.push(path);
    await router.isReady();

    const wrapper = mount(AppShell, {
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
    gsapFromToMock.mockClear();
    gsapToMock.mockClear();

    const fakeAudio = new FakePlayerAudio();
    const { configurePlayerAudioFactory } = await import("@/lib/player/audio");
    configurePlayerAudioFactory(() => fakeAudio);
  });

  afterEach(() => {
    while (mountedWrappers.length > 0) {
      mountedWrappers.pop()?.unmount();
    }
    document.body.innerHTML = "";
  });

  it("页面展示中文曲目信息与大封面，并保留侧栏、顶栏、Dock", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountPlayerShell("/player");
    const player = usePlayerStore(pinia);

    await player.playTrackById("track-dawn-echo");
    await flushPromises();

    expect(wrapper.find("#player-page").exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-shell-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-shell-topbar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="player-dock-shell"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("正在播放");
    expect(wrapper.get('[data-testid="player-track-title"]').text()).toBe("晨雾回声");
    expect(wrapper.get('[data-testid="player-track-artist"]').text()).toContain("北纬合成社");
    expect(wrapper.find('[data-testid="player-cover-image"]').exists()).toBe(true);
  }, 10000);

  it("有歌词时会高亮当前行", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountPlayerShell("/player");
    const player = usePlayerStore(pinia);

    await player.playTrackById("track-dawn-echo");
    await flushPromises();
    player.seekTo(9);
    await flushPromises();

    const activeLine = wrapper.get('[data-testid="player-lyrics-active-line"]');
    expect(activeLine.text()).toContain("城市刚醒来");
  }, 10000);

  it("无歌词时会显示中文空状态", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountPlayerShell("/player");
    const player = usePlayerStore(pinia);

    await player.playTrackById("track-orbit-glow");
    await flushPromises();

    expect(wrapper.text()).toContain("当前曲目暂无歌词");
  });

  it("页面内播放控制与 Dock 共用同一播放器状态", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountPlayerShell("/player");
    const player = usePlayerStore(pinia);

    expect(player.isPlaying).toBe(false);

    const playerControls = wrapper.get('[data-testid="player-view-controls"]');
    await playerControls.get('[data-testid="player-dock-toggle"]').trigger("click");
    await flushPromises();

    expect(player.isPlaying).toBe(true);
    expect(wrapper.get('[data-testid="player-dock-shell"]').get('[data-testid="player-dock-toggle"]').attributes("aria-pressed")).toBe("true");
  });

  it("切入播放器页面会触发 GSAP 路由过渡和区块 reveal", async () => {
    const { wrapper, router } = await mountPlayerShell("/");
    const initialFromToCalls = gsapFromToMock.mock.calls.length;

    await router.push("/player");
    await flushPromises();

    expect(wrapper.find("#player-page").exists()).toBe(true);
    expect(gsapFromToMock.mock.calls.length).toBeGreaterThan(initialFromToCalls);
  });

  it("切歌时会再次触发封面与歌词区的过渡动画", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { pinia } = await mountPlayerShell("/player");
    const player = usePlayerStore(pinia);
    const initialFromToCalls = gsapFromToMock.mock.calls.length;

    await player.playTrackById("track-dawn-echo");
    await flushPromises();
    await player.playTrackById("track-silver-steps");
    await flushPromises();

    expect(gsapFromToMock.mock.calls.length).toBeGreaterThan(initialFromToCalls);
  });
});
