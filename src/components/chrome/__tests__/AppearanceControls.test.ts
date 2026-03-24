import { mount } from "@vue/test-utils";
import { expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import AppearanceControls from "@/components/chrome/AppearanceControls.vue";

it("renders mode toggles and preset buttons", () => {
  setActivePinia(createPinia());
  const wrapper = mount(AppearanceControls, {
    global: { plugins: [createPinia()] },
  });

  expect(wrapper.find("[data-testid='theme-mode-light']").exists()).toBe(true);
  expect(wrapper.find("[data-testid='theme-preset-ocean']").exists()).toBe(true);
});
