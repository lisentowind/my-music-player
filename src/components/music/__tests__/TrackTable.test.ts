import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import TrackTable from "@/components/music/TrackTable.vue";
import type { Track } from "@/types/music";

const tracks: Track[] = [
  {
    id: "track-dawn-echo",
    title: "晨雾回声",
    artist: "NOVA 北纬",
    album: "低温清晨",
    durationSeconds: 24,
    durationLabel: "0:24",
    coverSrc: "/covers/cover-dawn.svg",
    audioSrc: "/media/sample-track-01.mp3",
    moodTags: ["冷调", "清透"],
    liked: true,
  },
  {
    id: "track-glacier-pulse",
    title: "冰川脉冲",
    artist: "NOVA 北纬",
    album: "低温清晨",
    durationSeconds: 26,
    durationLabel: "0:26",
    coverSrc: "/covers/cover-glacier.svg",
    audioSrc: "/media/sample-track-02.mp3",
    moodTags: ["克制", "律动"],
    liked: false,
  },
];

describe("track table", () => {
  it("点击歌曲行时发出 play(trackId)", async () => {
    const wrapper = mount(TrackTable, {
      props: {
        tracks,
      },
    });

    await wrapper.get('[data-testid="track-row-track-glacier-pulse"]').trigger("click");

    expect(wrapper.emitted("play")).toEqual([["track-glacier-pulse"]]);
  });

  it("根据 likedIds 与 activeTrackId 渲染喜欢与激活状态", () => {
    const wrapper = mount(TrackTable, {
      props: {
        tracks,
        likedIds: ["track-glacier-pulse"],
        activeTrackId: "track-dawn-echo",
      },
    });

    const activeRow = wrapper.get('[data-testid="track-row-track-dawn-echo"]');
    expect(activeRow.attributes("data-active")).toBe("true");

    const likedButton = wrapper.get('[data-testid="track-like-track-glacier-pulse"]');
    expect(likedButton.attributes("aria-pressed")).toBe("true");
  });
});
