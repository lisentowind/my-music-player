import type { AppearanceMode } from "@/lib/theme/presets";

export function applyThemeToDocument(input: {
  mode: Exclude<AppearanceMode, "system">;
  preset: string;
  accent: string;
}) {
  const root = document.documentElement;
  root.dataset.themeMode = input.mode;
  root.dataset.themePreset = input.preset;
  root.style.setProperty("--theme-accent", input.accent);
}
