import type { RouteRecordRaw } from "vue-router";
import AboutView from "@/views/AboutView.vue";
import HomeView from "@/views/HomeView.vue";

export const Home: RouteRecordRaw = {
  path: "/",
  name: "home",
  component: HomeView,
};

export const About: RouteRecordRaw = {
  path: "/about",
  name: "about",
  component: AboutView,
};

export const routes: RouteRecordRaw[] = [Home, About];
