import type { RouteRecordRaw } from "vue-router";
import { defineComponent, h } from "vue";

const HomePlaceholder = defineComponent({
  name: "HomePlaceholder",
  setup() {
    return () =>
      h("section", { class: "route-placeholder card" }, [
        h("h1", { class: "route-placeholder__title" }, "Home"),
        h("p", { class: "route-placeholder__description text-subtle" }, "Home page is pending Task 4."),
      ]);
  },
});

const AboutPlaceholder = defineComponent({
  name: "AboutPlaceholder",
  setup() {
    return () =>
      h("section", { class: "route-placeholder card" }, [
        h("h1", { class: "route-placeholder__title" }, "About"),
        h("p", { class: "route-placeholder__description text-subtle" }, "About page is pending Task 4."),
      ]);
  },
});

export const Home: RouteRecordRaw = {
  path: "/",
  name: "home",
  component: HomePlaceholder,
};

export const About: RouteRecordRaw = {
  path: "/about",
  name: "about",
  component: AboutPlaceholder,
};

export const routes: RouteRecordRaw[] = [Home, About];
