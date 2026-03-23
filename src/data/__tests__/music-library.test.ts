import { describe, expect, it } from "vitest";
import { featuredAlbums, likedTrackIds, tracks } from "@/data/music-library";

describe("music-library 数据契约", () => {
  it("每首歌的 audioSrc 都应以 /media/ 开头", () => {
    for (const track of tracks) {
      expect(track.audioSrc.startsWith("/media/")).toBe(true);
    }
  });

  it("likedTrackIds 与 tracks 中 liked 状态保持一致", () => {
    const likedFromTracks = tracks
      .filter(track => track.liked)
      .map(track => track.id)
      .sort();

    const likedFromIds = [...new Set(likedTrackIds)].sort();

    expect(likedFromIds).toEqual(likedFromTracks);
  });

  it("featuredAlbums 至少包含 3 张专辑", () => {
    expect(featuredAlbums.length).toBeGreaterThanOrEqual(3);
  });
});
