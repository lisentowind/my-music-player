import { nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAppearanceStore } from "@/stores/appearance";

const STORAGE_KEY = "my-player:appearance";

function createMatchMediaResult(matches: boolean): MediaQueryList {
  return {
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe("appearance store", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    window.matchMedia = vi.fn().mockReturnValue(createMatchMediaResult(false));
  });

  it("prefers a custom accent over the preset color", () => {
    const store = useAppearanceStore();
    store.setPreset("ocean");
    store.setCustomAccent("#ff7a59");
    expect(store.resolvedAccent).toBe("#ff7a59");
  });

  it("falls back to preset accent when custom accent is invalid", () => {
    const store = useAppearanceStore();
    store.setPreset("ocean");
    store.setCustomAccent("not-a-color");
    expect(store.resolvedAccent).toBe("#4f8cff");
  });

  it("resolves system mode through matchMedia", () => {
    const matchMediaSpy = vi.fn().mockReturnValue(createMatchMediaResult(true));
    window.matchMedia = matchMediaSpy;

    const store = useAppearanceStore();
    store.setMode("system");

    expect(store.resolveMode()).toBe("dark");
    expect(matchMediaSpy).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
  });

  it("hydrates state from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: "dark",
      presetId: "ocean",
      customAccent: "#ff7a59",
    }));

    const store = useAppearanceStore();
    store.hydrate();

    expect(store.mode).toBe("dark");
    expect(store.presetId).toBe("ocean");
    expect(store.customAccent).toBe("#ff7a59");
    expect(store.resolvedAccent).toBe("#ff7a59");
  });

  it("falls back to default light appearance when hydrate throws", () => {
    localStorage.setItem(STORAGE_KEY, "{invalid-json");

    const store = useAppearanceStore();
    store.hydrate();

    expect(store.mode).toBe("light");
    expect(store.presetId).toBe("mist");
    expect(store.customAccent).toBe("");
    expect(store.resolvedAccent).toBe("#7c95b5");
  });

  it("persists and applies appearance when state changes", async () => {
    const store = useAppearanceStore();

    store.setMode("dark");
    store.setPreset("peach");
    store.setCustomAccent("#123abc");
    await nextTick();

    expect(document.documentElement.dataset.themeMode).toBe("dark");
    expect(document.documentElement.dataset.themePreset).toBe("peach");
    expect(document.documentElement.style.getPropertyValue("--theme-accent")).toBe("#123abc");

    const persisted = localStorage.getItem(STORAGE_KEY);
    expect(persisted).not.toBeNull();
    expect(JSON.parse(persisted!)).toEqual({
      mode: "dark",
      presetId: "peach",
      customAccent: "#123abc",
    });
  });

  it("applies with sanitized preset when preset state is polluted", () => {
    const store = useAppearanceStore();

    (store as unknown as { presetId: string }).presetId = "invalid-preset";
    store.apply();

    expect(document.documentElement.dataset.themePreset).toBe("mist");
  });
});
