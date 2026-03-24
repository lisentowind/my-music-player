import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { featuredAlbums, getTracksByIds, tracks } from "@/data/music-library";

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

describe("discover view", () => {
  beforeEach(async () => {
    vi.resetModules();
    setActivePinia(createPinia());

    const fakeAudio = new FakePlayerAudio();
    const { configurePlayerAudioFactory } = await import("@/lib/player/audio");
    configurePlayerAudioFactory(() => fakeAudio);
  });

  it("点击推荐项会调用 player store 并更新当前播放", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const { default: DiscoverView } = await import("@/views/DiscoverView.vue");
    const player = usePlayerStore(pinia);
    const firstAlbumTracks = getTracksByIds(featuredAlbums[0]!.trackIds);
    const playContextSpy = vi.spyOn(player, "playContext");

    const wrapper = mount(DiscoverView, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain("最近播放");
    await wrapper.get("[data-album-card]").trigger("click");

    expect(playContextSpy).toHaveBeenCalledWith(firstAlbumTracks, "track-dawn-echo");
    expect(player.currentTrack?.id).toBe("track-dawn-echo");
  });

  it("先切到精选专辑后，再点跨专辑 quick pick 仍会切歌", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const { default: DiscoverView } = await import("@/views/DiscoverView.vue");
    const player = usePlayerStore(pinia);

    const wrapper = mount(DiscoverView, {
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.get("[data-album-card]").trigger("click");
    expect(player.currentTrack?.id).toBe("track-dawn-echo");
    expect(player.queue.map(track => track.id)).toEqual(featuredAlbums[0]?.trackIds);

    const quickMainButtons = wrapper.findAll(".discover-view__quick-main");
    expect(quickMainButtons.length).toBeGreaterThan(2);
    await quickMainButtons[2].trigger("click");

    expect(player.currentTrack?.id).toBe("track-orbit-glow");
    expect(player.queue).toHaveLength(tracks.length);
  });
});
