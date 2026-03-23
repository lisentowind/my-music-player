import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { featuredAlbums, likedTrackIds, tracks } from "@/data/music-library";
import { profileSeed } from "@/data/profile";

const publicDir = path.resolve(process.cwd(), "public");

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

  it("每首歌的 coverSrc/audioSrc 前缀正确，audio 对应文件实际存在", () => {
    for (const track of tracks) {
      expect(track.coverSrc.startsWith("/covers/")).toBe(true);
      expect(track.audioSrc.startsWith("/media/")).toBe(true);

      const audioFilePath = path.resolve(publicDir, track.audioSrc.slice(1));
      expect(fs.existsSync(audioFilePath)).toBe(true);
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

  it("featuredAlbums.trackIds 都存在于 tracks", () => {
    const trackIdSet = new Set(tracks.map(track => track.id));

    for (const album of featuredAlbums) {
      for (const trackId of album.trackIds) {
        expect(trackIdSet.has(trackId)).toBe(true);
      }
    }
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
