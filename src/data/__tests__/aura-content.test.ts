import { describe, expect, it } from "vitest";
import {
  auraContentPlaylists,
  auraDiscoverAtmospheres,
  auraDefaultPlaylist,
  auraDefaultPlaylistTracks,
  auraLibraryPlaylists,
  auraOnlineResourceManifest,
  auraRecommendationPlaylists,
  auraTracks,
  getAuraTracksByIds,
} from "@/data/aura-content";
import {
  featuredAlbums,
  getTracksByIds,
  likedTrackIds,
  tracks,
} from "@/data/music-library";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function containsChinese(text: string) {
  return /[\u4E00-\u9FFF]/u.test(text);
}

describe("aura-content 数据契约", () => {
  it("每首曲目都具备在线资源、时长、歌词、moods 与 tags", () => {
    expect(auraTracks.length).toBeGreaterThanOrEqual(5);

    const trackIds = auraTracks.map(track => track.id);
    expect(new Set(trackIds).size).toBe(trackIds.length);

    for (const track of auraTracks) {
      expect(track.coverSrc.startsWith("https://")).toBe(true);
      expect(track.audioSrc.startsWith("https://")).toBe(true);
      expect(track.durationLabel).toBe(formatDuration(track.durationSeconds));
      expect(Array.isArray(track.moods)).toBe(true);
      expect(Array.isArray(track.tags)).toBe(true);
      expect(track.moods.length).toBeGreaterThan(0);
      expect(track.tags.length).toBeGreaterThan(0);
      expect(track.moodTags).toEqual(track.moods);
      expect(track.moodTags).toBe(track.moods);
      expect(track.lyrics === null || /\[\d{2}:\d{2}\.\d{2}\]/u.test(track.lyrics)).toBe(true);
    }
  });

  it("默认歌单、推荐区、资料库区都从同一套内容源派生", () => {
    const playlistById = new Map(auraContentPlaylists.map(playlist => [playlist.id, playlist] as const));

    expect(playlistById.has(auraDefaultPlaylist.id)).toBe(true);
    expect(auraRecommendationPlaylists.length).toBeGreaterThan(0);
    expect(auraLibraryPlaylists.length).toBeGreaterThan(0);

    for (const playlist of [auraDefaultPlaylist, ...auraRecommendationPlaylists, ...auraLibraryPlaylists]) {
      expect(playlistById.has(playlist.id)).toBe(true);
      for (const trackId of playlist.trackIds) {
        expect(auraTracks.some(track => track.id === trackId)).toBe(true);
      }
    }

    expect(auraDefaultPlaylistTracks.map(track => track.id)).toEqual(auraDefaultPlaylist.trackIds);
  });

  it("推荐区歌单都可安全派生 discover 卡片", () => {
    expect(auraDiscoverAtmospheres.length).toBe(auraRecommendationPlaylists.length);

    for (const playlist of auraRecommendationPlaylists) {
      expect(playlist.trackIds.length).toBeGreaterThan(0);
    }
  });

  it("用户可见标题、标签、状态字段均为中文", () => {
    for (const playlist of auraContentPlaylists) {
      expect(containsChinese(playlist.title)).toBe(true);
      expect(containsChinese(playlist.subtitle)).toBe(true);
      expect(containsChinese(playlist.statusLabel)).toBe(true);

      for (const tag of playlist.tags) {
        expect(containsChinese(tag)).toBe(true);
      }
    }

    for (const track of auraTracks) {
      for (const mood of track.moods) {
        expect(containsChinese(mood)).toBe(true);
      }
      for (const tag of track.tags) {
        expect(containsChinese(tag)).toBe(true);
      }
    }
  });

  it("所有在线资源都在统一资源清单中导出", () => {
    const urlsFromTracks = new Set(
      auraTracks.flatMap(track => [track.coverSrc, track.audioSrc]),
    );
    const urlsFromManifest = new Set(auraOnlineResourceManifest.map(resource => resource.url));

    expect(urlsFromManifest).toEqual(urlsFromTracks);
    expect(auraOnlineResourceManifest.length).toBe(auraTracks.length * 2);

    for (const resource of auraOnlineResourceManifest) {
      expect(resource.url.startsWith("https://")).toBe(true);
      expect(resource.trackId.length).toBeGreaterThan(0);
      expect(resource.kind === "cover" || resource.kind === "audio").toBe(true);
    }
  });

  it("music-library 作为兼容层转发 aura-content 数据", () => {
    expect(tracks).toEqual(auraTracks);
    expect(featuredAlbums.map(album => album.trackIds)).toEqual(auraRecommendationPlaylists.map(playlist => playlist.trackIds));

    const likedFromTracks = tracks
      .filter(track => track.liked)
      .map(track => track.id)
      .sort();

    expect([...likedTrackIds].sort()).toEqual(likedFromTracks);
    expect(getTracksByIds(auraDefaultPlaylist.trackIds)).toEqual(auraDefaultPlaylistTracks);
    expect(getAuraTracksByIds(auraDefaultPlaylist.trackIds)).toEqual(auraDefaultPlaylistTracks);
  });

  it("getAuraTracksByIds/getTracksByIds 在混合 missing id 时忽略缺失并保留重复顺序", () => {
    const mixedIds = [auraTracks[1]!.id, "missing-track-id", auraTracks[1]!.id, auraTracks[4]!.id];
    const expected = [auraTracks[1]!, auraTracks[1]!, auraTracks[4]!];

    expect(getAuraTracksByIds(mixedIds)).toEqual(expected);
    expect(getTracksByIds(mixedIds)).toEqual(expected);
  });
});
