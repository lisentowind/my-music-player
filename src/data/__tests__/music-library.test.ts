import { describe, expect, it } from "vitest";
import {
  auraTracks,
  auraRecommendationPlaylists,
} from "@/data/aura-content";
import {
  featuredAlbums,
  getTracksByIds,
  likedTrackIds,
  tracks,
} from "@/data/music-library";
import { profileSeed } from "@/data/profile";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

describe("music-library 数据契约", () => {
  it("tracks 至少有 5 首歌，且 id 唯一", () => {
    expect(tracks.length).toBeGreaterThanOrEqual(5);

    const trackIds = tracks.map(track => track.id);
    expect(new Set(trackIds).size).toBe(trackIds.length);
  });

  it("tracks 与 aura 全曲库保持一致，且资源地址为 https", () => {
    expect(tracks).toEqual(auraTracks);
    expect(tracks).toBe(auraTracks);

    for (const track of tracks) {
      expect(track.coverSrc.startsWith("https://")).toBe(true);
      expect(track.audioSrc.startsWith("https://")).toBe(true);
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

  it("featuredAlbums 与 aura 推荐区歌单保持一致", () => {
    expect(featuredAlbums.map(album => album.trackIds)).toEqual(
      auraRecommendationPlaylists.map(playlist => playlist.trackIds),
    );

    const trackIdSet = new Set(tracks.map(track => track.id));

    for (const album of featuredAlbums) {
      for (const trackId of album.trackIds) {
        expect(trackIdSet.has(trackId)).toBe(true);
      }
    }
  });

  it("getTracksByIds 保持兼容层查询行为", () => {
    const trackIds = tracks.map(track => track.id);
    expect(getTracksByIds(trackIds)).toEqual(tracks);
  });

  it("getTracksByIds 在混合 missing id 时忽略缺失并保留重复顺序", () => {
    const mixedIds = [tracks[0]!.id, "missing-track-id", tracks[0]!.id, tracks[2]!.id];

    expect(getTracksByIds(mixedIds)).toEqual([tracks[0]!, tracks[0]!, tracks[2]!]);
  });

  it("profileSeed.quickPicks[].trackId 都存在于 tracks", () => {
    const trackIdSet = new Set(tracks.map(track => track.id));

    for (const pick of profileSeed.quickPicks) {
      expect(trackIdSet.has(pick.trackId)).toBe(true);
    }
  });

  it("profileSeed.signatureTags 都能命中曲库标签全集", () => {
    const moodTagSet = new Set(tracks.flatMap(track => track.moodTags));

    for (const tag of profileSeed.signatureTags) {
      expect(moodTagSet.has(tag)).toBe(true);
    }
  });

  it("durationLabel 与 durationSeconds 一致", () => {
    for (const track of tracks) {
      expect(track.durationLabel).toBe(formatDuration(track.durationSeconds));
    }
  });
});
