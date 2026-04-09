import type { RouteRecordRaw } from "vue-router";
import ExploreView from "@/views/ExploreView.vue";
import HomeView from "@/views/HomeView.vue";
import LibraryView from "@/views/LibraryView.vue";
import PlayerView from "@/views/PlayerView.vue";
import PlaylistView from "@/views/PlaylistView.vue";

export const Home: RouteRecordRaw = {
  path: "/",
  name: "home",
  component: HomeView,
  meta: {
    title: "首页",
    showInSidebar: true,
  },
};

export const Explore: RouteRecordRaw = {
  path: "/explore",
  name: "explore",
  component: ExploreView,
  meta: {
    title: "探索",
    showInSidebar: true,
  },
};

export const Playlist: RouteRecordRaw = {
  path: "/playlist",
  name: "playlist",
  component: PlaylistView,
  meta: {
    title: "歌单",
    showInSidebar: true,
  },
};

export const PlaylistDetail: RouteRecordRaw = {
  path: "/playlist/:playlistId",
  name: "playlist-detail",
  component: PlaylistView,
  meta: {
    title: "歌单详情",
    showInSidebar: false,
  },
};

export const Library: RouteRecordRaw = {
  path: "/library",
  name: "library",
  component: LibraryView,
  meta: {
    title: "资料库",
    showInSidebar: true,
  },
};

export const Player: RouteRecordRaw = {
  path: "/player",
  name: "player",
  component: PlayerView,
  meta: {
    title: "播放器",
    showInSidebar: true,
  },
};

export const routes: RouteRecordRaw[] = [Home, Explore, Playlist, PlaylistDetail, Library, Player];
