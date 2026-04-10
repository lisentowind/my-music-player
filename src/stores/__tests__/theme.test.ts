import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UiThemePalette from "@/components/ui/UiThemePalette.vue";
import UiThemeToggle from "@/components/ui/UiThemeToggle.vue";
import { THEME_PRESETS, useThemeStore } from "@/stores/theme";

function mockMatchMedia(matches = false) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let currentMatches = matches;
  const mediaQuery = {
    get matches() {
      return currentMatches;
    },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatch(nextMatches: boolean) {
      currentMatches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
  } as MediaQueryList & { dispatch: (nextMatches: boolean) => void };

  vi.stubGlobal("matchMedia", vi.fn(() => mediaQuery));
  return mediaQuery;
}

describe("useThemeStore", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-theme-mode");
    document.documentElement.removeAttribute("data-theme-resolved");
    document.documentElement.style.removeProperty("--theme-accent");
    setActivePinia(createPinia());
  });

  it("默认使用 system 模式，并基于系统偏好解析 resolvedMode", () => {
    mockMatchMedia(false);
    const store = useThemeStore();

    expect(store.mode).toBe("system");
    expect(store.resolvedMode).toBe("light");

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)") as MediaQueryList & { dispatch: (nextMatches: boolean) => void };
    mediaQuery.dispatch(true);

    expect(store.resolvedMode).toBe("dark");
  });

  it("切换模式后会同步写入 document 属性", async () => {
    mockMatchMedia(false);
    const store = useThemeStore();

    store.setMode("dark");
    await nextTick();
    expect(store.resolvedMode).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme-mode")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme-resolved")).toBe("dark");
    expect(document.documentElement.style.getPropertyValue("--color-bg")).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue("--color-text")).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue("--color-panel-fill")).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue("--color-popover-fill")).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue("--shadow-sm")).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue("--shadow-md")).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue("--shadow-lg")).toBeTruthy();

    store.setMode("light");
    await nextTick();
    expect(store.resolvedMode).toBe("light");
    expect(document.documentElement.getAttribute("data-theme-mode")).toBe("light");
    expect(document.documentElement.getAttribute("data-theme-resolved")).toBe("light");
    expect(document.documentElement.style.getPropertyValue("--color-bg")).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue("--color-text")).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue("--shadow-sm")).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue("--shadow-md")).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue("--shadow-lg")).toBeTruthy();
  });

  it("支持预设主题色和自由颜色输入", async () => {
    mockMatchMedia(false);
    const store = useThemeStore();

    expect(store.presets).toEqual(THEME_PRESETS);
    expect(store.themeColor).toBe(THEME_PRESETS[0]?.color);

    const secondPreset = THEME_PRESETS[1]!;
    store.setPreset(secondPreset.id);
    await nextTick();
    expect(store.activePresetId).toBe(secondPreset.id);
    expect(store.themeColor).toBe(secondPreset.color);

    store.setCustomColor("#12ab34");
    await nextTick();
    expect(store.customColor).toBe("#12ab34");
    expect(store.activePresetId).toBe("");
    expect(store.themeColor).toBe("#12ab34");
    expect(document.documentElement.style.getPropertyValue("--theme-accent")).toBe("#12ab34");
    expect(document.documentElement.style.getPropertyValue("--color-accent-pressed")).toBeTruthy();
    expect(document.documentElement.style.getPropertyValue("--color-state-accent-soft")).toContain("rgba(");
    expect(document.documentElement.style.getPropertyValue("--gradient-primary")).toContain("linear-gradient");
    expect(document.documentElement.style.getPropertyValue("--shadow-primary-hover")).toBeTruthy();

    store.setPreset(secondPreset.id);
    await nextTick();
    expect(store.activePresetId).toBe(secondPreset.id);
    expect(store.customColor).toBe("");
    expect(store.themeColor).toBe(secondPreset.color);
  });

  it("会规范化自由颜色输入，并忽略非法值", async () => {
    mockMatchMedia(false);
    const store = useThemeStore();

    store.setCustomColor(" #12AB34 ");
    await nextTick();
    expect(store.customColor).toBe("#12ab34");
    expect(store.activePresetId).toBe("");
    expect(store.themeColor).toBe("#12ab34");

    store.setCustomColor("not-a-color");
    await nextTick();
    expect(store.customColor).toBe("#12ab34");
    expect(store.themeColor).toBe("#12ab34");
  });

  it("会为亮色和深色主题派生不同的最佳主题色结果", async () => {
    mockMatchMedia(false);
    const store = useThemeStore();

    store.setCustomColor("#5f7f9b");
    store.setMode("dark");
    await nextTick();
    const darkAccent = document.documentElement.style.getPropertyValue("--color-accent");
    const darkCanvas = document.documentElement.style.getPropertyValue("--color-bg-canvas");

    store.setMode("light");
    await nextTick();
    const lightAccent = document.documentElement.style.getPropertyValue("--color-accent");
    const lightCanvas = document.documentElement.style.getPropertyValue("--color-bg-canvas");

    expect(darkAccent).not.toBe(lightAccent);
    expect(darkCanvas).not.toBe(lightCanvas);
  });

  it("亮色模式会输出独立的壳层阴影和分层变量，避免界面发灰发白", async () => {
    mockMatchMedia(false);
    const store = useThemeStore();

    store.setCustomColor("#5f7f9b");
    store.setMode("dark");
    await nextTick();
    const darkShadowSm = document.documentElement.style.getPropertyValue("--shadow-sm");
    const darkShadowMd = document.documentElement.style.getPropertyValue("--shadow-md");
    const darkPanelBorder = document.documentElement.style.getPropertyValue("--color-panel-border");
    const darkControlStroke = document.documentElement.style.getPropertyValue("--color-control-stroke");

    store.setMode("light");
    await nextTick();
    const lightShadowSm = document.documentElement.style.getPropertyValue("--shadow-sm");
    const lightShadowMd = document.documentElement.style.getPropertyValue("--shadow-md");
    const lightPanelBorder = document.documentElement.style.getPropertyValue("--color-panel-border");
    const lightControlStroke = document.documentElement.style.getPropertyValue("--color-control-stroke");

    expect(lightShadowSm).toBeTruthy();
    expect(lightShadowMd).toBeTruthy();
    expect(lightPanelBorder).toBeTruthy();
    expect(lightControlStroke).toBeTruthy();
    expect(lightShadowSm).not.toBe(darkShadowSm);
    expect(lightShadowMd).not.toBe(darkShadowMd);
    expect(lightPanelBorder).not.toBe(darkPanelBorder);
    expect(lightControlStroke).not.toBe(darkControlStroke);
  });
});

describe("UiThemeToggle", () => {
  it("通过 v-model 输出主题模式，并展示 resolvedMode", async () => {
    const wrapper = mount(UiThemeToggle, {
      props: {
        modelValue: "system",
        resolvedMode: "dark",
      },
    });

    expect(wrapper.get("[data-testid='theme-resolved-mode']").text()).toContain("深色");

    await wrapper.get("[data-testid='theme-mode-light']").trigger("click");

    expect(wrapper.emitted("update:modelValue")).toEqual([["light"]]);
  });
});

describe("UiThemePalette", () => {
  it("对外只通过预设选择和颜色输入两个事件工作", async () => {
    const wrapper = mount(UiThemePalette, {
      props: {
        presets: THEME_PRESETS,
        activePresetId: "",
        modelValue: "#12ab34",
      },
    });

    await wrapper.get(`[data-testid='theme-preset-${THEME_PRESETS[1]!.id}']`).trigger("click");
    expect(wrapper.emitted("selectPreset")).toEqual([[THEME_PRESETS[1]!.id]]);

    await wrapper.get("[data-testid='theme-custom-color']").setValue("#ff6600");
    expect(wrapper.emitted("update:modelValue")).toEqual([["#ff6600"]]);
    expect(wrapper.find(".ui-theme-palette__swatch.is-active").exists()).toBe(false);
  });
});
