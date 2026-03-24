import type { RouteRecordRaw } from "vue-router";
import DiscoverView from "@/views/DiscoverView.vue";
import LikedView from "@/views/LikedView.vue";
import ProfileView from "@/views/ProfileView.vue";

export const Discover: RouteRecordRaw = {
  path: "/",
  name: "discover",
  component: DiscoverView,
};

export const Liked: RouteRecordRaw = {
  path: "/liked",
  name: "liked",
  component: LikedView,
};

export const Profile: RouteRecordRaw = {
  path: "/profile",
  name: "profile",
  component: ProfileView,
};

export const routes: RouteRecordRaw[] = [Discover, Liked, Profile];
