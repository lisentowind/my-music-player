import type { UserProfileSeed } from "@/types/music";
import { likedTrackIds, tracks } from "@/data/music-library";

export const profileSeed: UserProfileSeed = {
  id: "profile-main",
  displayName: "林雾",
  headline: "冷感电子与玻璃质感声场爱好者",
  avatarSrc: "/avatars/profile-main.svg",
  signatureTags: ["冷调", "克制", "清透", "液态玻璃"],
  metrics: [
    {
      id: "metric-liked",
      label: "收藏歌曲",
      value: `${likedTrackIds.length} 首`,
    },
    {
      id: "metric-library",
      label: "当前曲库",
      value: `${tracks.length} 首`,
    },
    {
      id: "metric-focus",
      label: "本周专注",
      value: "7 小时",
    },
  ],
  quickPicks: [
    {
      id: "pick-morning",
      title: "晨间通勤",
      subtitle: "轻节奏，不抢注意力",
      trackId: "track-dawn-echo",
    },
    {
      id: "pick-focus",
      title: "深度专注",
      subtitle: "低频稳定，循环友好",
      trackId: "track-glacier-pulse",
    },
    {
      id: "pick-night",
      title: "夜行慢速",
      subtitle: "空间混响，收束情绪",
      trackId: "track-orbit-glow",
    },
  ],
};
