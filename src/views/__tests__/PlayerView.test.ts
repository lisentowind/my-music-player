import { readFileSync } from "node:fs";
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
    timeline: () => {
      const timeline = {
        to: (_target: unknown, to: { onComplete?: () => void }) => {
          to.onComplete?.();
          return timeline;
        },
        kill: vi.fn(),
      };

      return timeline;
    },
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

  it("页面展示中文曲目信息与大封面，并切成无侧栏顶栏的全屏播放器", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountPlayerShell("/player");
    const player = usePlayerStore(pinia);

    await player.playTrackById("track-dawn-echo");
    await flushPromises();

    expect(wrapper.find("#player-page").exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-shell-sidebar"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="app-shell-topbar"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="player-dock-shell"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="player-immersive-dock"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("正在播放");
    expect(wrapper.get('[data-testid="player-track-title"]').text()).toBe("晨雾回声");
    expect(wrapper.get('[data-testid="player-track-artist"]').text()).toContain("北纬合成社");
    expect(wrapper.find('[data-testid="player-cover-image"]').exists()).toBe(true);
  }, 20000);

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

  it("播放器页切换为 Stitch 沉浸式布局骨架", async () => {
    const { wrapper } = await mountPlayerShell("/player");

    const page = wrapper.get("#player-page");
    expect(page.attributes("data-player-visual")).toBe("immersive-stitch");
    expect(page.attributes("data-player-min-width")).toBe("1220");
    expect(page.attributes("data-player-min-height")).toBe("760");
    expect(wrapper.get('[data-testid="player-canvas-layout"]').attributes("data-player-layout")).toBe("cover-lyrics-split");
    expect(wrapper.get('[data-testid="player-canvas-layout"]').attributes("data-player-balance")).toBe("art-left-heavy");
    expect(wrapper.get('[data-testid="player-cover-stage"]').attributes("data-player-region")).toBe("art");
    expect(wrapper.get('[data-testid="player-lyrics-stage"]').attributes("data-player-region")).toBe("lyrics");
    expect(wrapper.get('[data-testid="player-progress-stage"]').attributes("data-player-region")).toBe("progress");
  });

  it("沉浸式播放器对较小高度窗口提供封面自适应约束，避免遮挡歌词和信息", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/views/PlayerView.vue", "utf-8");

    expect(source).toContain("data-player-art-sizing=\"responsive-contained\"");
    expect(source).toContain("@media (max-height: 860px)");
    expect(source).toContain("calc(100vh - 350px)");
  });

  it("页面内播放控制与共享播放器状态同步", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountPlayerShell("/player");
    const player = usePlayerStore(pinia);

    expect(player.isPlaying).toBe(false);

    const playerControls = wrapper.get('[data-testid="player-immersive-dock"]');
    await playerControls.get('[data-testid="player-dock-toggle"]').trigger("click");
    await flushPromises();

    expect(player.isPlaying).toBe(true);
    expect(wrapper.get('[data-testid="player-immersive-dock"]').get('[data-testid="player-dock-toggle"]').attributes("aria-pressed")).toBe("true");
  });

  it("全屏播放器底栏固定铺满底部，并声明小尺寸下也保持可见", async () => {
    const { wrapper } = await mountPlayerShell("/player");

    const immersiveDock = wrapper.get('[data-testid="player-immersive-dock"]');
    expect(immersiveDock.attributes("data-player-dock-style")).toBe("immersive-flat-band");
    expect(immersiveDock.attributes("data-player-dock-fixed")).toBe("true");
    expect(immersiveDock.attributes("data-player-dock-integration")).toBe("flush-surface");
    expect(immersiveDock.attributes("data-player-dock-min-width")).toBe("960");
  });

  it("播放器页源码包含双向封面过渡与贴底一体化控制带实现", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/views/PlayerView.vue", "utf-8");

    expect(source).toContain("PLAYER_FULLSCREEN_RETURN_KEY");
    expect(source).toContain("data-player-dock-style=\"immersive-flat-band\"");
    expect(source).toContain(".player-view__control-stage::before");
    expect(source).toContain(":mode=\"player.mode\"");
    expect(source).toContain("height: 100vh;");
    expect(source).toContain("gsap.set(coverElement, { autoAlpha: 1, scale: 1, filter: \"blur(0px)\" });");
  });

  it("沉浸式播放器右下角图标区为独立操作组，并和音量区保持明确间距", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/views/PlayerView.vue", "utf-8");

    expect(source).toContain(".player-view__side-actions {");
    expect(source).toContain(".player-view__control-side {\n  justify-content: flex-end;\n  gap: 14px;");
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

  it("沉浸式背景源码包含低幅度的动态主题光晕，让画面更灵动但保持克制", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/views/PlayerView.vue", "utf-8");

    expect(source).toContain("player-view__backdrop-orb");
    expect(source).toContain("useGsapAmbientFlow(");
    expect(source).toContain(".player-view__backdrop-orb");
    expect(source).toContain(".player-view__art-glow");
    expect(source).toContain("x: -32");
    expect(source).toContain("scale: 1.12");
    expect(source).not.toContain("@keyframes player-aura-drift");
    expect(source).not.toContain("animation: player-aura-drift");
  });
});
