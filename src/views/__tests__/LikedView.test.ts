import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { featuredAlbums, getTracksByIds } from "@/data/music-library";

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

describe("liked view", () => {
  beforeEach(async () => {
    vi.resetModules();
    setActivePinia(createPinia());

    const fakeAudio = new FakePlayerAudio();
    const { configurePlayerAudioFactory } = await import("@/lib/player/audio");
    configurePlayerAudioFactory(() => fakeAudio);
  });

  it("在真实 store 下，先进入专辑上下文再点喜欢列表跨专辑播放仍会切歌", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const { default: LikedView } = await import("@/views/LikedView.vue");
    const player = usePlayerStore(pinia);

    await player.playContext(getTracksByIds(featuredAlbums[0]!.trackIds), "track-dawn-echo");
    expect(player.currentTrack?.id).toBe("track-dawn-echo");
    expect(player.queue.map(track => track.id)).toEqual(featuredAlbums[0]!.trackIds);

    const wrapper = mount(LikedView, {
      global: {
        plugins: [pinia],
      },
    });

    await wrapper.get("[data-testid='track-play-track-orbit-glow']").trigger("click");

    expect(player.currentTrack?.id).toBe("track-orbit-glow");
  }, 10000);
});
