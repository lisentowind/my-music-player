import { defineStore } from "pinia";
import { computed, onScopeDispose, ref, watch } from "vue";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedThemeMode = "light" | "dark";
export type ThemeColorSource = "preset" | "custom";

export interface ThemePreset {
  id: string;
  name: string;
  color: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "frost", name: "霜蓝", color: "#5f7f9b" },
  { id: "mint", name: "青柠", color: "#1e9f8b" },
  { id: "sunset", name: "暖橙", color: "#c57242" },
  { id: "violet", name: "暮紫", color: "#6b66c8" },
  { id: "rose", name: "蔷薇", color: "#bf5d82" },
];

const COLOR_HEX_PATTERN = /^#([0-9a-fA-F]{6})$/;

function normalizeHexColor(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!COLOR_HEX_PATTERN.test(normalized)) {
    return "";
  }

  return normalized;
}

function clampChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function hexToRgb(hexColor: string) {
  const normalized = normalizeHexColor(hexColor);
  if (!normalized) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map(channel => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function tintHex(hexColor: string, delta: number) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return hexColor;
  }

  return rgbToHex(rgb.r + delta, rgb.g + delta, rgb.b + delta);
}

function toSoftRgba(hexColor: string, alpha: number) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return `rgba(95, 127, 155, ${alpha})`;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getSystemPrefersDark() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>("system");
  const presets = THEME_PRESETS;
  const activePresetId = ref(presets[0]?.id ?? "");
  const customColor = ref("");
  const systemPrefersDark = ref(getSystemPrefersDark());

  const activePreset = computed(() => presets.find(item => item.id === activePresetId.value) ?? null);
  const presetColor = computed(() => activePreset.value?.color || presets[0]?.color || "#5f7f9b");
  const colorSource = computed<ThemeColorSource>(() => (customColor.value ? "custom" : "preset"));
  const themeColor = computed(() => customColor.value || presetColor.value);
  const resolvedMode = computed<ResolvedThemeMode>(() => {
    if (mode.value === "system") {
      return systemPrefersDark.value ? "dark" : "light";
    }

    return mode.value;
  });

  function setMode(nextMode: ThemeMode) {
    mode.value = nextMode;
  }

  function setPreset(presetId: string) {
    const targetPreset = presets.find(item => item.id === presetId);
    if (!targetPreset) {
      return;
    }

    activePresetId.value = targetPreset.id;
    customColor.value = "";
  }

  function setCustomColor(nextColor: string) {
    const normalized = normalizeHexColor(nextColor);
    if (!normalized) {
      return;
    }

    activePresetId.value = "";
    customColor.value = normalized;
  }

  function syncToDocument() {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const accentColor = themeColor.value;
    root.setAttribute("data-theme-mode", mode.value);
    root.setAttribute("data-theme-resolved", resolvedMode.value);
    root.setAttribute("data-theme-color-source", colorSource.value);
    root.style.setProperty("--theme-accent", accentColor);
    root.style.setProperty("--color-accent", accentColor);
    root.style.setProperty("--color-accent-pressed", tintHex(accentColor, -18));
    root.style.setProperty("--color-state-accent-soft", toSoftRgba(accentColor, 0.16));
    root.style.setProperty(
      "--gradient-primary",
      `linear-gradient(135deg, ${tintHex(accentColor, 24)} 0%, ${accentColor} 100%)`,
    );
    root.style.setProperty(
      "--gradient-primary-hover",
      `linear-gradient(135deg, ${tintHex(accentColor, 30)} 0%, ${tintHex(accentColor, 8)} 100%)`,
    );
    root.style.setProperty(
      "--gradient-primary-active",
      `linear-gradient(135deg, ${tintHex(accentColor, 16)} 0%, ${tintHex(accentColor, -6)} 100%)`,
    );
    root.style.setProperty("--shadow-primary-hover", `0 10px 24px ${toSoftRgba(accentColor, 0.28)}`);
    root.style.setProperty("--shadow-primary-active", `0 6px 16px ${toSoftRgba(accentColor, 0.24)}`);
  }

  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      systemPrefersDark.value = event.matches;
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
      onScopeDispose(() => {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      });
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
      onScopeDispose(() => {
        mediaQuery.removeListener(handleSystemThemeChange);
      });
    }
  }

  watch([mode, resolvedMode, themeColor, colorSource], syncToDocument, { immediate: true });

  return {
    mode,
    resolvedMode,
    colorSource,
    presets,
    activePreset,
    activePresetId,
    customColor,
    presetColor,
    themeColor,
    setMode,
    setPreset,
    setCustomColor,
  };
});
