export type AppearanceMode = "light" | "dark" | "system";
export type ThemePresetId = "mist" | "ocean" | "peach" | "graphite";

export interface ThemePreset {
  id: ThemePresetId;
  label: string;
  accent: string;
}

export const defaultThemePresetId: ThemePresetId = "mist";

export const themePresets: ThemePreset[] = [
  { id: "mist", label: "雾银", accent: "#7c95b5" },
  { id: "ocean", label: "海雾", accent: "#4f8cff" },
  { id: "peach", label: "暖桃", accent: "#ff8a72" },
  { id: "graphite", label: "石墨", accent: "#7b8597" },
];

const defaultThemePresetFallback: ThemePreset = {
  id: defaultThemePresetId,
  label: "雾银",
  accent: "#7c95b5",
};

export function resolveThemePreset(presetId: unknown): ThemePreset {
  if (typeof presetId !== "string") {
    return themePresets.find(item => item.id === defaultThemePresetId) ?? defaultThemePresetFallback;
  }

  return themePresets.find(item => item.id === presetId)
    ?? themePresets.find(item => item.id === defaultThemePresetId)
    ?? defaultThemePresetFallback;
}
