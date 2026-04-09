import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("profile view", () => {
  beforeEach(async () => {
    vi.resetModules();
    setActivePinia(createPinia());

    const fakeAudio = new FakePlayerAudio();
    const { configurePlayerAudioFactory } = await import("@/lib/player/audio");
    configurePlayerAudioFactory(() => fakeAudio);
  });

  it("空态与有数据态会随 recent 播放记录切换", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const { default: ProfileView } = await import("@/views/ProfileView.vue");
    const player = usePlayerStore(pinia);

    const wrapper = mount(ProfileView, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain("收藏歌曲");
    expect(wrapper.text()).toContain("最近播放");
    expect(wrapper.text()).toContain("当前会话还没有播放记录");
    expect(wrapper.text()).toContain("还没有最近播放记录");

    await player.playTrackById("track-dawn-echo");
    await nextTick();

    expect(wrapper.text()).toContain("刚刚播放");
    expect(wrapper.text()).not.toContain("当前会话还没有播放记录");
    expect(wrapper.text()).not.toContain("还没有最近播放记录");
  }, 20000);

  it("likedCount 与 activeModeLabel 会跟随 store 变化", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const { default: ProfileView } = await import("@/views/ProfileView.vue");
    const player = usePlayerStore(pinia);

    const wrapper = mount(ProfileView, {
      global: {
        plugins: [pinia],
      },
    });

    expect(wrapper.text()).toContain("收藏歌曲");
    expect(wrapper.text()).toContain("最近播放");
    expect(wrapper.text()).toContain("3 首");
    expect(wrapper.text()).toContain("顺序播放");

    player.toggleLike("track-dawn-echo");
    player.cycleMode();
    await nextTick();

    expect(wrapper.text()).toContain("2 首");
    expect(wrapper.text()).toContain("单曲循环");
  }, 20000);

  it("点击 recent 列表项会继续播放该歌曲", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const { default: ProfileView } = await import("@/views/ProfileView.vue");
    const player = usePlayerStore(pinia);

    await player.playTrackById("track-dawn-echo");
    await player.playTrackById("track-orbit-glow");

    const wrapper = mount(ProfileView, {
      global: {
        plugins: [pinia],
      },
    });

    expect(player.currentTrack?.id).toBe("track-orbit-glow");

    const targetButton = wrapper.findAll("button.recent-play-list__item")
      .find(button => button.text().includes("晨雾回声"));
    expect(targetButton).toBeDefined();

    await targetButton!.trigger("click");

    expect(player.currentTrack?.id).toBe("track-dawn-echo");
  }, 20000);

  it("口味标签会在 liked-only 与 recent+liked 场景下保持合理", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const { default: ProfileView } = await import("@/views/ProfileView.vue");
    const player = usePlayerStore(pinia);

    const wrapper = mount(ProfileView, {
      global: {
        plugins: [pinia],
      },
    });

    const tasteTagsText = () => wrapper.get(".profile-view__taste-tags").text();

    expect(tasteTagsText()).toContain("清透");
    expect(tasteTagsText()).not.toContain("克制");

    await player.playTrackById("track-glacier-pulse");
    await nextTick();

    expect(tasteTagsText()).toContain("清透");
    expect(tasteTagsText()).toContain("克制");
  }, 20000);
});
