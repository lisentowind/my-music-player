import type { UserProfileSeed } from "@/types/music";

export const profileSeed: UserProfileSeed = {
  id: "profile-main",
  displayName: "林雾",
  headline: "冷感电子与玻璃质感声场爱好者",
  avatarSrc: "/avatars/profile-main.svg",
  signatureTags: ["冷调", "克制", "清透", "液态玻璃"],
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
