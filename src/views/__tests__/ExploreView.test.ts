import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auraRecommendationPlaylists } from "@/data/aura-content";
import { routes } from "@/router/routes";
import { EXPLORE_SEARCH_DEBOUNCE_MS } from "@/views/explore.constants";

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

describe("explore view", () => {
  async function mountExplore() {
    const pinia = createPinia();
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    await router.push("/explore");
    await router.isReady();

    const { default: ExploreView } = await import("@/views/ExploreView.vue");
    const wrapper = mount(ExploreView, {
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("无输入时展示默认探索态，并提供搜索输入框", async () => {
    const { wrapper } = await mountExplore();

    expect(wrapper.find("#explore-page").exists()).toBe(true);
    wrapper.get('[data-testid="explore-search-input"]');
    expect(wrapper.text()).toContain("探索声场");
    expect(wrapper.text()).toContain("热门标签");
    expect(wrapper.text()).toContain("推荐歌单");
  });

  it("搜索会以 150ms debounce 按曲名、艺人、专辑、歌单名和标签过滤", async () => {
    vi.useFakeTimers();
    const { wrapper } = await mountExplore();
    const input = wrapper.get('[data-testid="explore-search-input"]');

    await input.setValue("低温");
    await flushPromises();
    expect(wrapper.text()).not.toContain("晨雾回声");

    vi.advanceTimersByTime(EXPLORE_SEARCH_DEBOUNCE_MS - 1);
    await flushPromises();
    expect(wrapper.text()).not.toContain("晨雾回声");

    vi.advanceTimersByTime(1);
    await flushPromises();
    expect(wrapper.text()).toContain("晨雾回声");

    await input.setValue("北纬合成社");
    vi.advanceTimersByTime(EXPLORE_SEARCH_DEBOUNCE_MS);
    await flushPromises();
    expect(wrapper.text()).toContain("冰川脉冲");

    await input.setValue("夜色常驻");
    vi.advanceTimersByTime(EXPLORE_SEARCH_DEBOUNCE_MS);
    await flushPromises();
    expect(wrapper.text()).toContain("默认歌单");

    await input.setValue("清透");
    vi.advanceTimersByTime(EXPLORE_SEARCH_DEBOUNCE_MS);
    await flushPromises();
    expect(wrapper.text()).toContain("标签匹配");
  });

  it("无结果时展示中文空状态", async () => {
    vi.useFakeTimers();
    const { wrapper } = await mountExplore();

    await wrapper.get('[data-testid="explore-search-input"]').setValue("完全不存在的关键词");
    vi.advanceTimersByTime(EXPLORE_SEARCH_DEBOUNCE_MS);
    await flushPromises();

    expect(wrapper.text()).toContain("没有找到对应内容");
  });

  it("点击歌单卡片会跳转到 /playlist/:playlistId", async () => {
    const { wrapper, router } = await mountExplore();

    await wrapper.get(`[data-testid="explore-playlist-open-${auraRecommendationPlaylists[0]!.id}"]`).trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe(`/playlist/${auraRecommendationPlaylists[0]!.id}`);
  });
});
