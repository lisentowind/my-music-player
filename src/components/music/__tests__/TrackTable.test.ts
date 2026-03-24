import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import TrackTable from "@/components/music/TrackTable.vue";

const tracks = [
  {
    id: "track-dawn-echo",
    title: "晨雾回声",
    artist: "NOVA 北纬",
    album: "低温清晨",
    durationLabel: "0:24",
  },
  {
    id: "track-glacier-pulse",
    title: "冰川脉冲",
    artist: "NOVA 北纬",
    album: "低温清晨",
    durationLabel: "0:26",
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

  it("点击喜欢按钮只触发 toggleLike，不会触发 play", async () => {
    const wrapper = mount(TrackTable, {
      props: {
        tracks,
      },
    });

    await wrapper.get('[data-testid="track-like-track-dawn-echo"]').trigger("click");

    expect(wrapper.emitted("toggleLike")).toEqual([["track-dawn-echo"]]);
    expect(wrapper.emitted("play")).toBeUndefined();
  });

  it("liked 状态变化时更新 like 按钮 aria-label", async () => {
    const wrapper = mount(TrackTable, {
      props: {
        tracks,
        likedIds: [],
      },
    });

    const likeButton = wrapper.get('[data-testid="track-like-track-dawn-echo"]');
    expect(likeButton.attributes("aria-label")).toBe("喜欢 晨雾回声");

    await wrapper.setProps({
      likedIds: ["track-dawn-echo"],
    });

    expect(likeButton.attributes("aria-label")).toBe("取消喜欢 晨雾回声");
  });

  it("行元素可聚焦且支持回车/空格触发播放", async () => {
    const wrapper = mount(TrackTable, {
      props: {
        tracks,
      },
    });

    const row = wrapper.get('[data-testid="track-row-track-dawn-echo"]');
    expect(row.attributes("role")).toBe("button");
    expect(row.attributes("tabindex")).toBe("0");

    await row.trigger("keydown.enter");
    await row.trigger("keydown.space");

    expect(wrapper.emitted("play")).toEqual([["track-dawn-echo"], ["track-dawn-echo"]]);
  });
});
