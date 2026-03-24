import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAppearanceStore } from "@/stores/appearance";

describe("appearance store", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("prefers a custom accent over the preset color", () => {
    const store = useAppearanceStore();
    store.setPreset("ocean");
    store.setCustomAccent("#ff7a59");
    expect(store.resolvedAccent).toBe("#ff7a59");
  });
});
