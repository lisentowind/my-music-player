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
    expect(wrapper.get('[data-testid="player-dock-artist"]').text()).toContain("NOVA 北纬");
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
});
