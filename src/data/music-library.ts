import type { FeaturedAlbum, Track } from "@/types/music";

export const tracks: Track[] = [
  {
    id: "track-dawn-echo",
    title: "晨雾回声",
    artist: "NOVA 北纬",
    album: "低温清晨",
    durationSeconds: 24,
    durationLabel: "0:24",
    coverSrc: "/covers/cover-dawn.svg",
    audioSrc: "/media/sample-track-01.mp3",
    moodTags: ["冷调", "清透", "液态玻璃"],
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
    moodTags: ["克制", "律动", "专注", "液态玻璃"],
    liked: false,
  },
  {
    id: "track-orbit-glow",
    title: "轨道余辉",
    artist: "Linearity",
    album: "近地轨道",
    durationSeconds: 28,
    durationLabel: "0:28",
    coverSrc: "/covers/cover-orbit.svg",
    audioSrc: "/media/sample-track-03.mp3",
    moodTags: ["空灵", "夜行", "液态玻璃"],
    liked: true,
  },
  {
    id: "track-cold-window",
    title: "冷窗反射",
    artist: "Linearity",
    album: "近地轨道",
    durationSeconds: 26,
    durationLabel: "0:26",
    coverSrc: "/covers/cover-dawn.svg",
    audioSrc: "/media/sample-track-02.mp3",
    moodTags: ["氛围", "纯净", "液态玻璃"],
    liked: false,
  },
  {
    id: "track-silver-steps",
    title: "银阶漫步",
    artist: "Iris Atelier",
    album: "玻璃雨",
    durationSeconds: 24,
    durationLabel: "0:24",
    coverSrc: "/covers/cover-glacier.svg",
    audioSrc: "/media/sample-track-01.mp3",
    moodTags: ["轻盈", "精致", "清透"],
    liked: true,
  },
  {
    id: "track-midnight-mirror",
    title: "午夜镜面",
    artist: "Iris Atelier",
    album: "玻璃雨",
    durationSeconds: 28,
    durationLabel: "0:28",
    coverSrc: "/covers/cover-orbit.svg",
    audioSrc: "/media/sample-track-03.mp3",
    moodTags: ["深蓝", "低频", "克制"],
    liked: false,
  },
];

export const likedTrackIds = tracks
  .filter(track => track.liked)
  .map(track => track.id);

export const featuredAlbums: FeaturedAlbum[] = [
  {
    id: "album-low-temp-morning",
    title: "低温清晨",
    artist: "NOVA 北纬",
    coverSrc: "/covers/cover-dawn.svg",
    subtitle: "编辑精选",
    description: "为清晨通勤准备的冷色合成器声场，轻推节奏但不打扰思路。",
    trackIds: ["track-dawn-echo", "track-glacier-pulse"],
  },
  {
    id: "album-orbit",
    title: "近地轨道",
    artist: "Linearity",
    coverSrc: "/covers/cover-orbit.svg",
    subtitle: "夜间推荐",
    description: "在极简鼓点和空间混响之间，保留夜晚应有的留白。",
    trackIds: ["track-orbit-glow", "track-cold-window"],
  },
  {
    id: "album-glass-rain",
    title: "玻璃雨",
    artist: "Iris Atelier",
    coverSrc: "/covers/cover-glacier.svg",
    subtitle: "收藏上新",
    description: "细颗粒质感和温柔低频并行，适合长时间专注循环。",
    trackIds: ["track-silver-steps", "track-midnight-mirror"],
  },
];

export interface DiscoverAtmosphere {
  id: string;
  title: string;
  subtitle: string;
  trackId: string;
}

export const discoverAtmospheres: DiscoverAtmosphere[] = [
  {
    id: "atmo-cool-air",
    title: "冷空气模式",
    subtitle: "稀薄节拍，保留思路留白",
    trackId: "track-glacier-pulse",
  },
  {
    id: "atmo-city-night",
    title: "城市夜行",
    subtitle: "空间混响和柔和低频",
    trackId: "track-orbit-glow",
  },
  {
    id: "atmo-soft-focus",
    title: "柔焦专注",
    subtitle: "温和颗粒，循环不疲劳",
    trackId: "track-silver-steps",
  },
];

const trackById = new Map(tracks.map(track => [track.id, track] as const));

export function getTracksByIds(trackIds: readonly string[]) {
  return trackIds
    .map(trackId => trackById.get(trackId))
    .filter((track): track is Track => Boolean(track));
}
