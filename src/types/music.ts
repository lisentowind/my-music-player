export type PlaybackMode = "sequential" | "repeat-one" | "shuffle";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
  durationLabel: string;
  coverSrc: string;
  audioSrc: string;
  lyrics: string | null;
  moods: string[];
  tags: string[];
  // 兼容已有 store 的聚合逻辑，后续可统一迁移到 moods。
  moodTags: string[];
  liked: boolean;
}

export interface FeaturedAlbum {
  id: string;
  title: string;
  artist: string;
  coverSrc: string;
  subtitle: string;
  description: string;
  trackIds: string[];
}

export interface QuickPick {
  id: string;
  title: string;
  subtitle: string;
  trackId: string;
}

export interface UserProfileSeed {
  id: string;
  displayName: string;
  headline: string;
  avatarSrc: string;
  signatureTags: string[];
  quickPicks: QuickPick[];
}

export type AuraPlaylistZone = "默认歌单" | "推荐区" | "资料库区";

export interface AuraPlaylist {
  id: string;
  zone: AuraPlaylistZone;
  title: string;
  subtitle: string;
  statusLabel: string;
  description: string;
  coverSrc: string;
  tags: string[];
  trackIds: string[];
}

export interface AuraOnlineResource {
  id: string;
  trackId: string;
  kind: "cover" | "audio";
  url: string;
}

export interface AuraResourceValidationItem {
  resourceKey: string;
  trackId: string;
  kind: AuraOnlineResource["kind"];
  primaryUrl: string;
  fallbackUrl: string | null;
  description: string;
}

export type QueueSourceKind = "global" | "context";

export interface QueueSource {
  kind: QueueSourceKind;
  trackIds: string[];
  contextId: string;
}
