import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auraLibraryPlaylists, auraTracks } from "@/data/aura-content";
import { routes } from "@/router/routes";

vi.mock("gsap", () => ({
  gsap: {
    fromTo: (_target: unknown, _from: unknown, to: { onComplete?: () => void }) => {
      to.onComplete?.();
      return { kill: vi.fn() };
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

describe("library view", () => {
  async function mountLibrary() {
    const pinia = createPinia();
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    await router.push("/library");
    await router.isReady();

    const { default: LibraryView } = await import("@/views/LibraryView.vue");
    const wrapper = mount(LibraryView, {
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

  it("页面标题、主焦点卡、小卡区和艺人区均为中文", async () => {
    const { wrapper } = await mountLibrary();

    expect(wrapper.find("#library-page").exists()).toBe(true);
    expect(wrapper.text()).toContain("我喜欢的歌曲");
    expect(wrapper.text()).toContain("资料库小卡片");
    expect(wrapper.text()).toContain("资料库精选");
    expect(wrapper.text()).toContain("常听艺人");
  });

  it("收藏内容与播放器会话态联动", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountLibrary();
    const player = usePlayerStore(pinia);

    expect(wrapper.text()).toContain(`${player.likedCount} 首`);

    player.toggleLike("track-dawn-echo");
    await flushPromises();

    expect(wrapper.text()).toContain(`${player.likedCount} 首`);
  });

  it("大焦点卡可直接播放，资料库歌单卡可进入对应歌单", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia, router } = await mountLibrary();
    const player = usePlayerStore(pinia);

    await wrapper.get('[data-testid="library-focus-play"]').trigger("click");
    await flushPromises();
    expect(player.currentTrack?.id).toBeTruthy();
    expect(player.queueSource.kind).toBe("context");

    await wrapper.get(`[data-testid="library-playlist-open-${auraLibraryPlaylists[0]!.id}"]`).trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(`/playlist/${auraLibraryPlaylists[0]!.id}`);
  });

  it("没有收藏和最近播放时，会显示中文空状态提示", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountLibrary();
    const player = usePlayerStore(pinia);

    for (const track of auraTracks.filter(item => item.liked)) {
      player.toggleLike(track.id);
    }
    await flushPromises();

    expect(wrapper.text()).toContain("先播放一首歌，资料库会逐步形成你的个人轮廓。");
    expect(wrapper.text()).toContain("等你开始播放后，这里会出现常听艺人。");
  });
});
