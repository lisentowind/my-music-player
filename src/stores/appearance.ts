import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";
import { applyThemeToDocument } from "@/lib/theme/apply-theme";
import {
  defaultThemePresetId,
  resolveThemePreset,
  themePresets,
} from "@/lib/theme/presets";
import type { AppearanceMode, ThemePresetId } from "@/lib/theme/presets";

const STORAGE_KEY = "my-player:appearance";
const DEFAULT_FALLBACK_MODE: Exclude<AppearanceMode, "system"> = "light";
const ACCENT_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

interface PersistedAppearanceState {
  mode?: unknown;
  presetId?: unknown;
  customAccent?: unknown;
}

function isValidPresetId(value: unknown): value is ThemePresetId {
  return typeof value === "string"
    && themePresets.some(preset => preset.id === value);
}

function isValidAppearanceMode(value: unknown): value is AppearanceMode {
  return value === "light" || value === "dark" || value === "system";
}

function isValidAccentColor(value: unknown): value is string {
  return typeof value === "string"
    && ACCENT_COLOR_PATTERN.test(value);
}

export const useAppearanceStore = defineStore("appearance", () => {
  const mode = ref<AppearanceMode>("system");
  const presetId = ref<ThemePresetId>(defaultThemePresetId);
  const customAccent = ref("");
  const isHydrating = ref(false);

  const preset = computed(() => resolveThemePreset(presetId.value));
  const resolvedAccent = computed(() => isValidAccentColor(customAccent.value)
    ? customAccent.value
    : preset.value.accent);

  function setMode(nextMode: AppearanceMode) {
    mode.value = nextMode;
  }

  function setPreset(nextPreset: ThemePresetId) {
    presetId.value = nextPreset;
  }

  function setCustomAccent(value: string) {
    customAccent.value = value;
  }

  function clearCustomAccent() {
    customAccent.value = "";
  }

  function resolveMode(): Exclude<AppearanceMode, "system"> {
    if (mode.value === "light" || mode.value === "dark") {
      return mode.value;
    }

    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return DEFAULT_FALLBACK_MODE;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function hydrate() {
    isHydrating.value = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as PersistedAppearanceState;
      mode.value = isValidAppearanceMode(parsed.mode) ? parsed.mode : "system";
      presetId.value = isValidPresetId(parsed.presetId) ? parsed.presetId : defaultThemePresetId;
      customAccent.value = isValidAccentColor(parsed.customAccent) ? parsed.customAccent : "";
    } catch {
      mode.value = DEFAULT_FALLBACK_MODE;
      presetId.value = defaultThemePresetId;
      customAccent.value = "";
    } finally {
      isHydrating.value = false;
    }
  }

  function apply() {
    applyThemeToDocument({
      mode: resolveMode(),
      preset: preset.value.id,
      accent: resolvedAccent.value,
    });
  }

  watch([mode, presetId, customAccent], () => {
    if (isHydrating.value) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: mode.value,
        presetId: presetId.value,
        customAccent: customAccent.value,
      }));
    } catch {
      // Ignore storage failures to keep appearance behavior available in restricted environments.
    }

    apply();
  }, { flush: "sync" });

  return {
    mode,
    presetId,
    preset,
    customAccent,
    resolvedAccent,
    setMode,
    setPreset,
    setCustomAccent,
    clearCustomAccent,
    resolveMode,
    hydrate,
    apply,
  };
});
