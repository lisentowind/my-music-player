import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auraDefaultPlaylist, auraRecommendationPlaylists } from "@/data/aura-content";

vi.mock("howler", () => ({
  Howl: class {},
}));

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

describe("playlist view", () => {
  async function mountPlaylist(path = "/playlist") {
    const { routes } = await import("@/router/routes");
    const pinia = createPinia();
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    await router.push(path);
    await router.isReady();

    const { default: PlaylistView } = await import("@/views/PlaylistView.vue");
    const wrapper = mount(PlaylistView, {
      global: {
        plugins: [pinia, router],
      },
    });

    return { wrapper, pinia, router };
  }

  async function mountPlaylistShell(path = "/playlist") {
    const { routes } = await import("@/router/routes");
    const pinia = createPinia();
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    await router.push(path);
    await router.isReady();

    const { default: AppShell } = await import("@/components/AppShell.vue");
    const wrapper = mount(AppShell, {
      attachTo: document.body,
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

  it("/playlist 会渲染默认主打歌单", async () => {
    const { wrapper } = await mountPlaylist("/playlist");

    expect(wrapper.find("#playlist-page").exists()).toBe(true);
    expect(wrapper.text()).toContain(auraDefaultPlaylist.title);
    expect(wrapper.text()).toContain("歌单详情");
  }, 10000);

  it("/playlist/:playlistId 会渲染对应歌单", async () => {
    const playlist = auraRecommendationPlaylists[0]!;
    const { wrapper } = await mountPlaylist(`/playlist/${playlist.id}`);

    expect(wrapper.text()).toContain(playlist.title);
    expect(wrapper.text()).toContain(playlist.description);
  }, 10000);

  it("曲目行点击后可切歌，当前播放曲目行会高亮并与底部播放器联动", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountPlaylistShell("/playlist");
    const player = usePlayerStore(pinia);
    const targetTrackId = auraDefaultPlaylist.trackIds[1]!;

    await wrapper.get(`[data-testid="track-play-${targetTrackId}"]`).trigger("click");
    await flushPromises();

    expect(player.currentTrack?.id).toBe(targetTrackId);
    expect(wrapper.get(`[data-testid="track-row-${targetTrackId}"]`).attributes("data-active")).toBe("true");
    expect(player.queue.map(track => track.id)).toEqual(auraDefaultPlaylist.trackIds);
    expect(player.queueSource.kind).toBe("context");
    expect(wrapper.get('[data-testid="player-dock-title"]').text()).toBe(player.currentTrack?.title);
  }, 10000);

  it("收藏状态切换后会在当前会话内同步", async () => {
    const { usePlayerStore } = await import("@/stores/player");
    const { wrapper, pinia } = await mountPlaylist("/playlist");
    const player = usePlayerStore(pinia);
    const targetTrackId = auraDefaultPlaylist.trackIds[0]!;

    expect(player.likedTrackIdList).toContain(targetTrackId);

    await wrapper.get(`[data-testid="track-like-${targetTrackId}"]`).trigger("click");
    await flushPromises();

    expect(player.likedTrackIdList).not.toContain(targetTrackId);
    expect(wrapper.get(`[data-testid="track-like-${targetTrackId}"]`).text()).toContain("喜欢");
  });
});
