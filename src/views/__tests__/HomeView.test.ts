import { flushPromises, mount } from "@vue/test-utils";
import { readFileSync } from "node:fs";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auraDefaultPlaylist, auraRecommendationPlaylists } from "@/data/aura-content";
import { routes } from "@/router/routes";

vi.mock("gsap", () => ({
  gsap: {
    fromTo: (_target: unknown, _from: unknown, to: { onComplete?: () => void }) => {
      to.onComplete?.();
      return { kill: vi.fn() };
    },
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
    to: (_target: unknown, to: { onComplete?: () => void }) => {
      to.onComplete?.();
      return { kill: vi.fn() };
    },
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

describe("home view", () => {
  async function mountHome() {
    const pinia = createPinia();
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    await router.push("/");
    await router.isReady();

    const { default: HomeView } = await import("@/views/HomeView.vue");
    const wrapper = mount(HomeView, {
      global: {
        plugins: [pinia, router],
      },
    });

    return { wrapper, pinia, router };
  }

  beforeEach(async () => {
    vi.resetModules();
    setActivePinia(createPinia());

    const fakeAudio = new FakePlayerAudio();
    const { configurePlayerAudioFactory } = await import("@/lib/player/audio");
    configurePlayerAudioFactory(() => fakeAudio);
  });

  it("首页展示中文 Hero、最近播放、推荐歌单和情绪入口", async () => {
    const { wrapper } = await mountHome();

    expect(wrapper.find("#home-page").exists()).toBe(true);
    expect(wrapper.get('[data-testid="home-hero-shell"]').attributes("data-home-layout")).toBe("editorial-split");
    expect(wrapper.get('[data-testid="home-mixes-shell"]').attributes("data-home-region")).toBe("top-mixes");
    expect(wrapper.get('[data-testid="home-continue-shell"]').attributes("data-home-region")).toBe("recent-and-trending");
    expect(wrapper.get('[data-testid="home-recommend-shell"]').attributes("data-home-region")).toBe("editorial-posters");
    expect(wrapper.text()).toContain("夜色常驻");
    expect(wrapper.text()).toContain("你的混合精选");
    expect(wrapper.text()).toContain("最近播放");
    expect(wrapper.text()).toContain("推荐歌单");
    expect(wrapper.text()).toContain("情绪入口");
  });

  it("点击首页主打播放按钮会切换到默认歌单上下文", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountHome();
    const player = usePlayerStore(pinia);

    await wrapper.get('[data-testid="home-hero-play"]').trigger("click");
    await flushPromises();

    expect(player.currentTrack?.id).toBe(auraDefaultPlaylist.trackIds[0]);
    expect(player.queue.map(track => track.id)).toEqual(auraDefaultPlaylist.trackIds);
    expect(player.queueSource.kind).toBe("context");
  });

  it("点击首页推荐歌单卡会进入歌单详情，点击情绪卡会驱动切歌", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia, router } = await mountHome();
    const player = usePlayerStore(pinia);

    await wrapper.get(`[data-testid="home-playlist-open-${auraRecommendationPlaylists[0]!.id}"]`).trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(`/playlist/${auraRecommendationPlaylists[0]!.id}`);

    await router.push("/");
    await flushPromises();

    await wrapper.get('[data-testid="home-mood-card-0"]').trigger("click");
    await flushPromises();

    expect(player.currentTrack?.id).toBeTruthy();
  });

  it("首页源码包含低幅度的动态氛围层，让下半区背景更有活力但不过分抢戏", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/views/HomeView.vue", "utf-8");

    expect(source).toContain("home-view__ambient--ember");
    expect(source).toContain("home-view__ambient--halo");
    expect(source).toContain("home-view__ambient--veil");
    expect(source).toContain("useGsapAmbientFlow(");
    expect(source).toContain(".home-view__ambient--halo");
    expect(source).toContain(".home-view__ambient--veil");
    expect(source).toContain("home-view__mix-grid");
    expect(source).not.toContain("@keyframes home-ambient-drift");
    expect(source).not.toContain("animation: home-ambient-drift");
  });
});
