import type { AppearanceMode, ThemePresetId } from "@/lib/theme/presets";

export function applyThemeToDocument(input: {
  mode: Exclude<AppearanceMode, "system">;
  preset: ThemePresetId;
  accent: string;
}) {
  const root = globalThis.document?.documentElement;
  if (!root) {
    return;
  }

  root.dataset.themeMode = input.mode;
  root.dataset.themePreset = input.preset;
  root.style.setProperty("--theme-accent", input.accent);
}
