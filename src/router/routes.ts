import type { RouteRecordRaw } from "vue-router";
import DiscoverView from "@/views/DiscoverView.vue";
import LikedView from "@/views/LikedView.vue";
import ProfileView from "@/views/ProfileView.vue";

export const Discover: RouteRecordRaw = {
  path: "/",
  name: "discover",
  component: DiscoverView,
  meta: {
    title: "推荐",
    showInSidebar: true,
  },
};

export const Liked: RouteRecordRaw = {
  path: "/liked",
  name: "liked",
  component: LikedView,
  meta: {
    title: "我喜欢",
    showInSidebar: true,
  },
};

export const Profile: RouteRecordRaw = {
  path: "/profile",
  name: "profile",
  component: ProfileView,
  meta: {
    title: "个人中心",
    showInSidebar: true,
  },
};

export const routes: RouteRecordRaw[] = [Discover, Liked, Profile];
