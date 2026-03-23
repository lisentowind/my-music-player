export type PlaybackMode = "sequential" | "repeat-one" | "repeat-all";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
  durationLabel: string;
  coverSrc: string;
  audioSrc: string;
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

export interface ProfileMetric {
  id: string;
  label: string;
  value: string;
}

export interface UserProfileSeed {
  id: string;
  displayName: string;
  headline: string;
  avatarSrc: string;
  signatureTags: string[];
  metrics: ProfileMetric[];
  quickPicks: QuickPick[];
}
