import { mount } from "@vue/test-utils";
import { expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import AppearanceControls from "@/components/chrome/AppearanceControls.vue";
import { useAppearanceStore } from "@/stores/appearance";

it("switches mode and updates active semantics", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useAppearanceStore();
  const wrapper = mount(AppearanceControls, {
    global: { plugins: [pinia] },
  });

  const systemButton = wrapper.get("[data-testid='theme-mode-system']");
  const lightButton = wrapper.get("[data-testid='theme-mode-light']");

  expect(systemButton.attributes("role")).toBe("radio");
  expect(lightButton.attributes("role")).toBe("radio");
  expect(systemButton.attributes("aria-checked")).toBe("true");
  expect(lightButton.attributes("aria-checked")).toBe("false");

  await lightButton.trigger("click");

  expect(store.mode).toBe("light");
  expect(systemButton.attributes("aria-checked")).toBe("false");
  expect(lightButton.attributes("aria-checked")).toBe("true");
});

it("switches preset and updates active semantics", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useAppearanceStore();
  const wrapper = mount(AppearanceControls, {
    global: { plugins: [pinia] },
  });

  const mistButton = wrapper.get("[data-testid='theme-preset-mist']");
  const oceanButton = wrapper.get("[data-testid='theme-preset-ocean']");

  expect(mistButton.attributes("aria-pressed")).toBe("true");
  expect(oceanButton.attributes("aria-pressed")).toBe("false");

  await oceanButton.trigger("click");

  expect(store.presetId).toBe("ocean");
  expect(mistButton.attributes("aria-pressed")).toBe("false");
  expect(oceanButton.attributes("aria-pressed")).toBe("true");
});
