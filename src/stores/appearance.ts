import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";
import { applyThemeToDocument } from "@/lib/theme/apply-theme";
import { themePresets, type AppearanceMode, type ThemePresetId } from "@/lib/theme/presets";

const STORAGE_KEY = "my-player:appearance";
const DEFAULT_PRESET_ID: ThemePresetId = "mist";
const DEFAULT_FALLBACK_MODE: Exclude<AppearanceMode, "system"> = "light";

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
    && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

export const useAppearanceStore = defineStore("appearance", () => {
  const mode = ref<AppearanceMode>("system");
  const presetId = ref<ThemePresetId>(DEFAULT_PRESET_ID);
  const customAccent = ref("");

  const preset = computed(() => themePresets.find(item => item.id === presetId.value) ?? themePresets[0]);
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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as PersistedAppearanceState;
      mode.value = isValidAppearanceMode(parsed.mode) ? parsed.mode : "system";
      presetId.value = isValidPresetId(parsed.presetId) ? parsed.presetId : DEFAULT_PRESET_ID;
      customAccent.value = isValidAccentColor(parsed.customAccent) ? parsed.customAccent : "";
    } catch {
      mode.value = DEFAULT_FALLBACK_MODE;
      presetId.value = DEFAULT_PRESET_ID;
      customAccent.value = "";
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
  });

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
