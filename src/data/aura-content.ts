import type {
  AuraOnlineResource,
  AuraPlaylist,
  AuraResourceValidationItem,
  FeaturedAlbum,
  Track,
} from "@/types/music";
import auraResourceValidationManifestSource from "@/data/aura-resource-manifest.json";

export interface AuraDiscoverAtmosphere {
  id: string;
  title: string;
  subtitle: string;
  trackId: string;
}

type AuraTrackSeed = Omit<Track, "moodTags">;

const auraTrackSeeds: AuraTrackSeed[] = [
  {
    id: "track-dawn-echo",
    title: "晨雾回声",
    artist: "北纬合成社",
    album: "低温清晨",
    durationSeconds: 24,
    durationLabel: "0:24",
    coverSrc: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=640&q=80",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    lyrics: "[00:00.00]晨雾回声\n[00:08.20]城市刚醒来\n[00:16.40]呼吸落在玻璃上",
    moods: ["冷调", "清透", "晨光"],
    tags: ["合成器", "通勤", "氛围电子"],
    liked: true,
  },
  {
    id: "track-glacier-pulse",
    title: "冰川脉冲",
    artist: "北纬合成社",
    album: "低温清晨",
    durationSeconds: 26,
    durationLabel: "0:26",
    coverSrc: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=640&q=80",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    lyrics: "[00:00.00]冰川脉冲\n[00:10.00]心跳保持克制\n[00:18.50]节拍推着思绪前行",
    moods: ["克制", "律动", "专注", "液态玻璃"],
    tags: ["低频", "工作流", "电子律动"],
    liked: false,
  },
  {
    id: "track-orbit-glow",
    title: "轨道余辉",
    artist: "线性轨道",
    album: "近地轨道",
    durationSeconds: 28,
    durationLabel: "0:28",
    coverSrc: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=640&q=80",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    lyrics: null,
    moods: ["空灵", "夜行", "液态玻璃"],
    tags: ["空间混响", "深夜", "氛围"],
    liked: true,
  },
  {
    id: "track-cold-window",
    title: "冷窗反射",
    artist: "线性轨道",
    album: "近地轨道",
    durationSeconds: 26,
    durationLabel: "0:26",
    coverSrc: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=640&q=80",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    lyrics: "[00:00.00]冷窗反射\n[00:12.00]路灯在窗面游走\n[00:21.20]情绪被慢慢收束",
    moods: ["氛围", "纯净", "夜色"],
    tags: ["电子氛围", "反射感", "低亮度"],
    liked: false,
  },
  {
    id: "track-silver-steps",
    title: "银阶漫步",
    artist: "虹膜工坊",
    album: "玻璃雨",
    durationSeconds: 24,
    durationLabel: "0:24",
    coverSrc: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=640&q=80",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    lyrics: "[00:00.00]银阶漫步\n[00:09.80]步伐贴着雨声\n[00:18.00]城市在脚下变轻",
    moods: ["轻盈", "精致", "清透"],
    tags: ["女声氛围", "轻电子", "细颗粒"],
    liked: true,
  },
  {
    id: "track-midnight-mirror",
    title: "午夜镜面",
    artist: "虹膜工坊",
    album: "玻璃雨",
    durationSeconds: 28,
    durationLabel: "0:28",
    coverSrc: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=640&q=80",
    audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    lyrics: "[00:00.00]午夜镜面\n[00:08.50]霓虹落进水里\n[00:19.30]低频像潮汐推近",
    moods: ["深蓝", "低频", "克制"],
    tags: ["夜间推荐", "暗色电子", "循环友好"],
    liked: false,
  },
];

export const auraTracks: Track[] = auraTrackSeeds.map(track => ({
  ...track,
  moodTags: track.moods,
}));

export const auraContentPlaylists: AuraPlaylist[] = [
  {
    id: "playlist-default-aura",
    zone: "默认歌单",
    title: "夜色常驻",
    subtitle: "默认歌单",
    statusLabel: "正在主推",
    description: "用于首次进入播放器的默认主打歌单，覆盖通勤到夜间的完整节奏。",
    coverSrc: auraTracks[2]!.coverSrc,
    tags: ["主打", "深夜", "电子"],
    trackIds: auraTracks.map(track => track.id),
  },
  {
    id: "album-low-temp-morning",
    zone: "推荐区",
    title: "低温清晨",
    subtitle: "编辑精选",
    statusLabel: "推荐中",
    description: "冷色合成器与轻节奏并行，适合晨间通勤和轻量任务。",
    coverSrc: auraTracks[0]!.coverSrc,
    tags: ["晨间", "清透", "轻节奏"],
    trackIds: ["track-dawn-echo", "track-glacier-pulse"],
  },
  {
    id: "album-orbit",
    zone: "推荐区",
    title: "近地轨道",
    subtitle: "夜间推荐",
    statusLabel: "热度上升",
    description: "极简鼓点配合空间混响，保留夜晚应有的留白和距离。",
    coverSrc: auraTracks[2]!.coverSrc,
    tags: ["夜行", "空间感", "低频"],
    trackIds: ["track-orbit-glow", "track-cold-window"],
  },
  {
    id: "album-glass-rain",
    zone: "推荐区",
    title: "玻璃雨",
    subtitle: "收藏上新",
    statusLabel: "新入库",
    description: "细颗粒纹理与柔和低频并行，适合长时间专注循环。",
    coverSrc: auraTracks[4]!.coverSrc,
    tags: ["专注", "循环", "细颗粒"],
    trackIds: ["track-silver-steps", "track-midnight-mirror"],
  },
  {
    id: "library-focus-loop",
    zone: "资料库区",
    title: "专注循环",
    subtitle: "资料库精选",
    statusLabel: "已收藏",
    description: "用于长时间工作流的稳定循环集合。",
    coverSrc: auraTracks[1]!.coverSrc,
    tags: ["工作", "稳定", "低打扰"],
    trackIds: ["track-glacier-pulse", "track-silver-steps", "track-midnight-mirror"],
  },
  {
    id: "library-night-archive",
    zone: "资料库区",
    title: "夜航档案",
    subtitle: "资料库精选",
    statusLabel: "已同步",
    description: "夜间状态下的收束型曲目集合，保持情绪一致性。",
    coverSrc: auraTracks[3]!.coverSrc,
    tags: ["夜间", "收束", "氛围"],
    trackIds: ["track-orbit-glow", "track-cold-window", "track-midnight-mirror"],
  },
];

const auraTrackById = new Map(auraTracks.map(track => [track.id, track] as const));

function getRequiredPlaylist(predicate: (playlist: AuraPlaylist) => boolean) {
  const playlist = auraContentPlaylists.find(predicate);
  if (!playlist) {
    throw new Error("aura-content 缺少必要歌单定义。");
  }
  return playlist;
}

function getFirstTrackIdOrThrow(playlist: Pick<AuraPlaylist, "id" | "trackIds">) {
  const firstTrackId = playlist.trackIds[0];
  if (!firstTrackId) {
    throw new Error(`aura-content 推荐歌单 ${playlist.id} 至少包含一首曲目。`);
  }
  return firstTrackId;
}

export function getAuraTracksByIds(trackIds: readonly string[]) {
  return trackIds
    .map(trackId => auraTrackById.get(trackId))
    .filter((track): track is Track => Boolean(track));
}

export const auraDefaultPlaylist = getRequiredPlaylist(playlist => playlist.zone === "默认歌单");

export const auraRecommendationPlaylists = auraContentPlaylists.filter(
  playlist => playlist.zone === "推荐区",
);

export const auraLibraryPlaylists = auraContentPlaylists.filter(
  playlist => playlist.zone === "资料库区",
);

export const auraDefaultPlaylistTracks = getAuraTracksByIds(auraDefaultPlaylist.trackIds);

export const auraFeaturedAlbums: FeaturedAlbum[] = auraRecommendationPlaylists.map(playlist => ({
  id: playlist.id,
  title: playlist.title,
  artist: "回声星港合辑",
  coverSrc: playlist.coverSrc,
  subtitle: playlist.subtitle,
  description: playlist.description,
  trackIds: playlist.trackIds,
}));

export const auraDiscoverAtmospheres: AuraDiscoverAtmosphere[] = auraRecommendationPlaylists.map(
  playlist => ({
    id: `atmo-${playlist.id}`,
    title: playlist.title,
    subtitle: `${playlist.statusLabel} · ${playlist.subtitle}`,
    trackId: getFirstTrackIdOrThrow(playlist),
  }),
);

export const auraOnlineResourceManifest: AuraOnlineResource[] = auraTracks.flatMap(track => [
  {
    id: `${track.id}-cover`,
    trackId: track.id,
    kind: "cover",
    url: track.coverSrc,
  },
  {
    id: `${track.id}-audio`,
    trackId: track.id,
    kind: "audio",
    url: track.audioSrc,
  },
]);

export const auraResourceValidationManifest =
  auraResourceValidationManifestSource as AuraResourceValidationItem[];
