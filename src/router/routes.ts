import type { RouteRecordRaw } from "vue-router";
import { defineComponent, h } from "vue";

const placeholderContainerStyle = {
  maxWidth: "520px",
  margin: "0 auto",
} as const;

const placeholderTitleStyle = {
  margin: "0 0 var(--space-2)",
  fontSize: "24px",
  lineHeight: "1.3",
} as const;

const placeholderDescriptionStyle = {
  margin: "0",
} as const;

const HomePlaceholder = defineComponent({
  name: "HomePlaceholder",
  setup() {
    return () =>
      h("section", { class: "card", style: placeholderContainerStyle }, [
        h("h1", { style: placeholderTitleStyle }, "Home"),
        h(
          "p",
          { class: "text-subtle", style: placeholderDescriptionStyle },
          "Home page is pending Task 4.",
        ),
      ]);
  },
});

const AboutPlaceholder = defineComponent({
  name: "AboutPlaceholder",
  setup() {
    return () =>
      h("section", { class: "card", style: placeholderContainerStyle }, [
        h("h1", { style: placeholderTitleStyle }, "About"),
        h(
          "p",
          { class: "text-subtle", style: placeholderDescriptionStyle },
          "About page is pending Task 4.",
        ),
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
