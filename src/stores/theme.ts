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

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface HslColor {
  h: number;
  s: number;
  l: number;
}

interface ThemePalette {
  accent: string;
  accentPressed: string;
  accentSoft: string;
  onAccent: string;
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceStrong: string;
  surfaceContrast: string;
  text: string;
  textStrong: string;
  textSecondary: string;
  textTertiary: string;
  textContrast: string;
  textContrastMuted: string;
  border: string;
  borderStrong: string;
  glassHighlightStart: string;
  glassHighlightEnd: string;
  glassFallback: string;
  stateHover: string;
  stateActive: string;
  stateSelected: string;
  stateSurfaceMuted: string;
  stateBorderSubtle: string;
  stateBorderEmphasis: string;
  rangeThumbBorder: string;
  rangeThumbBg: string;
  shadowRangeThumb: string;
  scrollbarThumb: string;
  scrollbarTrack: string;
  scrollbarThumbBorder: string;
  gradientPrimary: string;
  gradientPrimaryHover: string;
  gradientPrimaryActive: string;
  shadowPrimaryHover: string;
  shadowPrimaryActive: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  bgCanvas: string;
  surfaceElevated: string;
  panelBorder: string;
  panelFill: string;
  panelGlowStart: string;
  panelGlowEnd: string;
  controlSurface: string;
  controlSurfaceStrong: string;
  controlStroke: string;
  cardSurfaceSoft: string;
  overlayScrim: string;
  popoverFill: string;
  popoverGlowStart: string;
  popoverGlowEnd: string;
  popoverShadow: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "frost", name: "霜蓝", color: "#5f7f9b" },
  { id: "mint", name: "青柠", color: "#1e9f8b" },
  { id: "sunset", name: "暖橙", color: "#c57242" },
  { id: "violet", name: "暮紫", color: "#6b66c8" },
  { id: "rose", name: "蔷薇", color: "#bf5d82" },
];

const COLOR_HEX_PATTERN = /^#([0-9a-fA-F]{6})$/;
const THEME_STORAGE_KEY = "aura-player-theme-preferences";

interface PersistedThemePreferences {
  mode?: ThemeMode;
  activePresetId?: string;
  customColor?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHexColor(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!COLOR_HEX_PATTERN.test(normalized)) {
    return "";
  }

  return normalized;
}

function hexToRgb(hexColor: string): RgbColor | null {
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
    .map(channel => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness * 100 };
  }

  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);

  let hue = 0;
  switch (max) {
    case red:
      hue = ((green - blue) / delta + (green < blue ? 6 : 0)) / 6;
      break;
    case green:
      hue = ((blue - red) / delta + 2) / 6;
      break;
    default:
      hue = ((red - green) / delta + 4) / 6;
  }

  return {
    h: hue * 360,
    s: saturation * 100,
    l: lightness * 100,
  };
}

function hueToRgb(p: number, q: number, t: number) {
  let temp = t;
  if (temp < 0) {
    temp += 1;
  }
  if (temp > 1) {
    temp -= 1;
  }
  if (temp < 1 / 6) {
    return p + (q - p) * 6 * temp;
  }
  if (temp < 1 / 2) {
    return q;
  }
  if (temp < 2 / 3) {
    return p + (q - p) * (2 / 3 - temp) * 6;
  }
  return p;
}

function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hue = ((h % 360) + 360) % 360 / 360;
  const saturation = clamp(s, 0, 100) / 100;
  const lightness = clamp(l, 0, 100) / 100;

  if (saturation === 0) {
    const channel = lightness * 255;
    return { r: channel, g: channel, b: channel };
  }

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - (lightness * saturation);
  const p = (2 * lightness) - q;

  return {
    r: hueToRgb(p, q, hue + (1 / 3)) * 255,
    g: hueToRgb(p, q, hue) * 255,
    b: hueToRgb(p, q, hue - (1 / 3)) * 255,
  };
}

function setHsl(hexColor: string, updates: Partial<HslColor>) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return hexColor;
  }

  const next = {
    ...rgbToHsl(rgb),
    ...updates,
  };

  const converted = hslToRgb(next);
  return rgbToHex(converted.r, converted.g, converted.b);
}

function mixHex(hexA: string, hexB: string, weight = 0.5) {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) {
    return hexA;
  }

  const ratio = clamp(weight, 0, 1);
  return rgbToHex(
    rgbA.r + ((rgbB.r - rgbA.r) * ratio),
    rgbA.g + ((rgbB.g - rgbA.g) * ratio),
    rgbA.b + ((rgbB.b - rgbA.b) * ratio),
  );
}

function toSoftRgba(hexColor: string, alpha: number) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return `rgba(95, 127, 155, ${alpha})`;
  }

  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha})`;
}

function relativeLuminance(hexColor: string) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return 0;
  }

  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function getReadableText(backgroundColor: string) {
  return relativeLuminance(backgroundColor) > 0.42 ? "#09111a" : "#f8fbff";
}

function calibrateAccent(baseColor: string, mode: ResolvedThemeMode) {
  const rgb = hexToRgb(baseColor);
  if (!rgb) {
    return baseColor;
  }

  const hsl = rgbToHsl(rgb);
  if (mode === "dark") {
    return setHsl(baseColor, {
      s: clamp(Math.max(hsl.s, 52) + 10, 56, 82),
      l: clamp(hsl.l < 48 ? hsl.l + 16 : hsl.l + 6, 58, 72),
    });
  }

  return setHsl(baseColor, {
    s: clamp(hsl.s * 0.88, 42, 68),
    l: clamp(hsl.l > 62 ? hsl.l - 18 : hsl.l - 6, 42, 56),
  });
}

function buildPalette(baseColor: string, mode: ResolvedThemeMode): ThemePalette {
  const accent = calibrateAccent(baseColor, mode);
  const onAccent = getReadableText(accent);
  const accentHsl = rgbToHsl(hexToRgb(accent)!);
  const accentPressed = setHsl(accent, {
    s: mode === "dark" ? clamp(accentHsl.s + 2, 50, 84) : clamp(accentHsl.s - 4, 36, 72),
    l: clamp(accentHsl.l - (mode === "dark" ? 10 : 8), 24, 64),
  });
  const accentHighlight = mixHex(accent, "#ffffff", mode === "dark" ? 0.18 : 0.1);
  const accentShadow = mixHex(accent, "#0a1018", mode === "dark" ? 0.52 : 0.28);

  const lightCanvasBase = mixHex("#f2ece4", accent, 0.08);
  const lightCanvasRaised = mixHex("#ebe2d8", accent, 0.1);
  const lightSurfaceBase = mixHex("#fbf6f1", accent, 0.04);
  const lightSurfaceRaised = mixHex("#f6efe7", accent, 0.08);
  const lightControlBase = mixHex("#f3ece5", accent, 0.12);
  const lightControlRaised = mixHex("#e6d8ca", accent, 0.22);
  const lightBorderBase = mixHex("#8f7c6b", accent, 0.26);
  const lightHighlight = toSoftRgba("#ffffff", 0.68);
  const lightShadowBase = mixHex("#5d4936", accent, 0.16);

  const bg = mode === "dark"
    ? mixHex("#050608", accent, 0.08)
    : lightCanvasBase;
  const bgElevated = mode === "dark"
    ? mixHex("#0c0f13", accent, 0.12)
    : lightCanvasRaised;
  const surface = toSoftRgba(mode === "dark" ? mixHex("#11151a", accent, 0.14) : lightSurfaceBase, mode === "dark" ? 0.78 : 0.92);
  const surfaceStrong = toSoftRgba(mode === "dark" ? mixHex("#171c24", accent, 0.14) : mixHex("#fffdfa", accent, 0.03), mode === "dark" ? 0.94 : 0.97);
  const surfaceContrast = mode === "dark" ? "#090b0e" : "#ffffff";
  const text = mode === "dark" ? "#edf2f7" : "#1a2230";
  const textStrong = mode === "dark" ? "#ffffff" : "#141b28";
  const textSecondary = toSoftRgba(text, mode === "dark" ? 0.78 : 0.8);
  const textTertiary = toSoftRgba(text, mode === "dark" ? 0.5 : 0.62);
  const textContrast = mode === "dark" ? "#ffffff" : "#111827";
  const textContrastMuted = toSoftRgba(textContrast, mode === "dark" ? 0.76 : 0.62);
  const border = toSoftRgba(mode === "dark" ? "#ffffff" : lightBorderBase, mode === "dark" ? 0.14 : 0.22);
  const borderStrong = toSoftRgba(mode === "dark" ? "#ffffff" : lightBorderBase, mode === "dark" ? 0.22 : 0.34);
  const panelFill = toSoftRgba(mode === "dark" ? mixHex("#0d1015", accent, 0.12) : lightSurfaceRaised, mode === "dark" ? 0.68 : 0.94);
  const popoverFill = toSoftRgba(mode === "dark" ? mixHex("#090c12", accent, 0.12) : mixHex("#f5ede4", accent, 0.1), mode === "dark" ? 0.9 : 0.97);
  const controlSurface = toSoftRgba(mode === "dark" ? "#ffffff" : lightControlBase, mode === "dark" ? 0.06 : 0.98);
  const controlSurfaceStrong = toSoftRgba(mode === "dark" ? "#ffffff" : lightControlRaised, mode === "dark" ? 0.11 : 1);
  const shadowSm = mode === "dark"
    ? `0 12px 28px ${toSoftRgba("#000000", 0.22)}`
    : `0 12px 24px ${toSoftRgba(lightShadowBase, 0.08)}, 0 3px 10px ${toSoftRgba(lightShadowBase, 0.05)}`;
  const shadowMd = mode === "dark"
    ? `0 22px 52px ${toSoftRgba("#000000", 0.3)}`
    : `0 18px 42px ${toSoftRgba(lightShadowBase, 0.1)}, 0 8px 18px ${toSoftRgba(lightShadowBase, 0.06)}`;
  const shadowLg = mode === "dark"
    ? `0 30px 72px ${toSoftRgba("#000000", 0.38)}`
    : `0 28px 68px ${toSoftRgba(lightShadowBase, 0.14)}, 0 12px 28px ${toSoftRgba(lightShadowBase, 0.08)}`;

  return {
    accent,
    accentPressed,
    accentSoft: toSoftRgba(accent, mode === "dark" ? 0.22 : 0.16),
    onAccent,
    bg,
    bgElevated,
    surface,
    surfaceStrong,
    surfaceContrast,
    text,
    textStrong,
    textSecondary,
    textTertiary,
    textContrast,
    textContrastMuted,
    border,
    borderStrong,
    glassHighlightStart: mode === "dark" ? toSoftRgba("#ffffff", 0.09) : lightHighlight,
    glassHighlightEnd: toSoftRgba("#ffffff", mode === "dark" ? 0.02 : 0.12),
    glassFallback: toSoftRgba(mode === "dark" ? "#0f1218" : "#ffffff", mode === "dark" ? 0.96 : 0.92),
    stateHover: mode === "dark" ? toSoftRgba("#ffffff", 0.07) : toSoftRgba(lightControlRaised, 0.72),
    stateActive: mode === "dark" ? toSoftRgba("#ffffff", 0.12) : toSoftRgba(lightControlRaised, 0.88),
    stateSelected: toSoftRgba(accent, mode === "dark" ? 0.18 : 0.18),
    stateSurfaceMuted: mode === "dark" ? toSoftRgba("#ffffff", 0.08) : toSoftRgba(lightControlBase, 0.72),
    stateBorderSubtle: border,
    stateBorderEmphasis: toSoftRgba(accent, mode === "dark" ? 0.3 : 0.24),
    rangeThumbBorder: toSoftRgba(accent, mode === "dark" ? 0.46 : 0.36),
    rangeThumbBg: mode === "dark" ? "#ffffff" : "#fcfdff",
    shadowRangeThumb: `0 4px 14px ${toSoftRgba(mode === "dark" ? "#000000" : "#111827", mode === "dark" ? 0.32 : 0.12)}`,
    scrollbarThumb: toSoftRgba(mode === "dark" ? "#b8c0cc" : "#263448", mode === "dark" ? 0.44 : 0.22),
    scrollbarTrack: mode === "dark" ? toSoftRgba("#ffffff", 0.03) : toSoftRgba(lightControlBase, 0.72),
    scrollbarThumbBorder: toSoftRgba(mode === "dark" ? "#000000" : "#ffffff", mode === "dark" ? 0.6 : 0.4),
    gradientPrimary: `linear-gradient(135deg, ${accentHighlight} 0%, ${accent} 100%)`,
    gradientPrimaryHover: `linear-gradient(135deg, ${mixHex(accentHighlight, "#ffffff", 0.1)} 0%, ${mixHex(accent, "#ffffff", 0.04)} 100%)`,
    gradientPrimaryActive: `linear-gradient(135deg, ${mixHex(accent, "#ffffff", 0.04)} 0%, ${accentPressed} 100%)`,
    shadowPrimaryHover: `0 18px 40px ${toSoftRgba(accentShadow, mode === "dark" ? 0.34 : 0.22)}`,
    shadowPrimaryActive: `0 12px 28px ${toSoftRgba(accentShadow, mode === "dark" ? 0.28 : 0.18)}`,
    shadowSm,
    shadowMd,
    shadowLg,
    bgCanvas: [
      `radial-gradient(circle at 20% 18%, ${toSoftRgba(accent, mode === "dark" ? 0.2 : 0.12)} 0%, transparent 30%)`,
      `radial-gradient(circle at 82% 12%, ${toSoftRgba(mixHex(accent, mode === "dark" ? "#5eead4" : "#0ea5e9", 0.3), mode === "dark" ? 0.1 : 0.08)} 0%, transparent 24%)`,
      `linear-gradient(180deg, ${bgElevated} 0%, ${bg} 52%, ${mixHex(bg, mode === "dark" ? "#000000" : "#ddd4ca", mode === "dark" ? 0.22 : 0.08)} 100%)`,
    ].join(", "),
    surfaceElevated: `linear-gradient(145deg, ${toSoftRgba(mode === "dark" ? "#1d232c" : mixHex("#fcf7f1", accent, 0.04), mode === "dark" ? 0.92 : 0.98)}, ${toSoftRgba(mode === "dark" ? "#12161d" : lightSurfaceRaised, mode === "dark" ? 0.86 : 0.92)})`,
    panelBorder: toSoftRgba(mode === "dark" ? accent : lightBorderBase, mode === "dark" ? 0.14 : 0.24),
    panelFill,
    panelGlowStart: mode === "dark" ? toSoftRgba("#ffffff", 0.08) : lightHighlight,
    panelGlowEnd: toSoftRgba("#ffffff", mode === "dark" ? 0.02 : 0.08),
    controlSurface,
    controlSurfaceStrong,
    controlStroke: toSoftRgba(mode === "dark" ? "#ffffff" : lightBorderBase, mode === "dark" ? 0.05 : 0.18),
    cardSurfaceSoft: `linear-gradient(180deg, ${toSoftRgba(mode === "dark" ? "#1f242d" : mixHex("#fdf8f3", accent, 0.03), mode === "dark" ? 0.94 : 0.99)}, ${toSoftRgba(mode === "dark" ? "#12161d" : lightSurfaceRaised, mode === "dark" ? 0.9 : 0.94)})`,
    overlayScrim: toSoftRgba(mode === "dark" ? "#020406" : "#d8cec2", mode === "dark" ? 0.36 : 0.42),
    popoverFill,
    popoverGlowStart: mode === "dark" ? toSoftRgba("#ffffff", 0.08) : lightHighlight,
    popoverGlowEnd: toSoftRgba("#ffffff", mode === "dark" ? 0.02 : 0.1),
    popoverShadow: toSoftRgba(mode === "dark" ? "#000000" : "#35281c", mode === "dark" ? 0.34 : 0.18),
  };
}

function getSystemPrefersDark() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readPersistedPreferences(): PersistedThemePreferences {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as PersistedThemePreferences;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function persistPreferences(nextState: PersistedThemePreferences) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(nextState));
}

export const useThemeStore = defineStore("theme", () => {
  const presets = THEME_PRESETS;
  const persisted = readPersistedPreferences();
  const persistedMode = persisted.mode === "light" || persisted.mode === "dark" || persisted.mode === "system"
    ? persisted.mode
    : "system";
  const persistedCustomColor = normalizeHexColor(persisted.customColor ?? "");
  const persistedPresetId = presets.some(item => item.id === persisted.activePresetId)
    ? persisted.activePresetId ?? presets[0]?.id ?? ""
    : presets[0]?.id ?? "";

  const mode = ref<ThemeMode>(persistedMode);
  const activePresetId = ref(persistedCustomColor ? "" : persistedPresetId);
  const customColor = ref(persistedCustomColor);
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
    const palette = buildPalette(themeColor.value, resolvedMode.value);

    root.setAttribute("data-theme-mode", mode.value);
    root.setAttribute("data-theme-resolved", resolvedMode.value);
    root.setAttribute("data-theme-color-source", colorSource.value);
    root.style.setProperty("color-scheme", resolvedMode.value);
    root.style.setProperty("--theme-accent", themeColor.value);
    root.style.setProperty("--color-accent", palette.accent);
    root.style.setProperty("--color-accent-pressed", palette.accentPressed);
    root.style.setProperty("--color-state-accent-soft", palette.accentSoft);
    root.style.setProperty("--color-on-accent", palette.onAccent);
    root.style.setProperty("--color-bg", palette.bg);
    root.style.setProperty("--color-bg-elevated", palette.bgElevated);
    root.style.setProperty("--color-surface", palette.surface);
    root.style.setProperty("--color-surface-strong", palette.surfaceStrong);
    root.style.setProperty("--color-surface-contrast", palette.surfaceContrast);
    root.style.setProperty("--color-text", palette.text);
    root.style.setProperty("--color-text-strong", palette.textStrong);
    root.style.setProperty("--color-text-secondary", palette.textSecondary);
    root.style.setProperty("--color-text-tertiary", palette.textTertiary);
    root.style.setProperty("--color-text-inverse", palette.onAccent);
    root.style.setProperty("--color-text-contrast", palette.textContrast);
    root.style.setProperty("--color-text-contrast-muted", palette.textContrastMuted);
    root.style.setProperty("--color-border", palette.border);
    root.style.setProperty("--color-border-strong", palette.borderStrong);
    root.style.setProperty("--color-glass-highlight-start", palette.glassHighlightStart);
    root.style.setProperty("--color-glass-highlight-end", palette.glassHighlightEnd);
    root.style.setProperty("--color-glass-fallback", palette.glassFallback);
    root.style.setProperty("--color-state-hover", palette.stateHover);
    root.style.setProperty("--color-state-active", palette.stateActive);
    root.style.setProperty("--color-state-selected", palette.stateSelected);
    root.style.setProperty("--color-state-surface-muted", palette.stateSurfaceMuted);
    root.style.setProperty("--color-state-border-subtle", palette.stateBorderSubtle);
    root.style.setProperty("--color-state-border-emphasis", palette.stateBorderEmphasis);
    root.style.setProperty("--color-range-thumb-border", palette.rangeThumbBorder);
    root.style.setProperty("--color-range-thumb-bg", palette.rangeThumbBg);
    root.style.setProperty("--shadow-range-thumb", palette.shadowRangeThumb);
    root.style.setProperty("--color-scrollbar-thumb", palette.scrollbarThumb);
    root.style.setProperty("--color-scrollbar-track", palette.scrollbarTrack);
    root.style.setProperty("--color-scrollbar-thumb-border", palette.scrollbarThumbBorder);
    root.style.setProperty("--gradient-primary", palette.gradientPrimary);
    root.style.setProperty("--gradient-primary-hover", palette.gradientPrimaryHover);
    root.style.setProperty("--gradient-primary-active", palette.gradientPrimaryActive);
    root.style.setProperty("--shadow-primary-hover", palette.shadowPrimaryHover);
    root.style.setProperty("--shadow-primary-active", palette.shadowPrimaryActive);
    root.style.setProperty("--shadow-sm", palette.shadowSm);
    root.style.setProperty("--shadow-md", palette.shadowMd);
    root.style.setProperty("--shadow-lg", palette.shadowLg);
    root.style.setProperty("--color-bg-canvas", palette.bgCanvas);
    root.style.setProperty("--color-surface-elevated", palette.surfaceElevated);
    root.style.setProperty("--color-panel-border", palette.panelBorder);
    root.style.setProperty("--color-panel-fill", palette.panelFill);
    root.style.setProperty("--color-panel-glow-start", palette.panelGlowStart);
    root.style.setProperty("--color-panel-glow-end", palette.panelGlowEnd);
    root.style.setProperty("--color-control-surface", palette.controlSurface);
    root.style.setProperty("--color-control-surface-strong", palette.controlSurfaceStrong);
    root.style.setProperty("--color-control-stroke", palette.controlStroke);
    root.style.setProperty("--color-card-surface-soft", palette.cardSurfaceSoft);
    root.style.setProperty("--color-overlay-scrim", palette.overlayScrim);
    root.style.setProperty("--color-popover-fill", palette.popoverFill);
    root.style.setProperty("--color-popover-glow-start", palette.popoverGlowStart);
    root.style.setProperty("--color-popover-glow-end", palette.popoverGlowEnd);
    root.style.setProperty("--color-popover-shadow", palette.popoverShadow);
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
  watch([mode, activePresetId, customColor], () => {
    persistPreferences({
      mode: mode.value,
      activePresetId: customColor.value ? "" : activePresetId.value,
      customColor: customColor.value,
    });
  }, { immediate: true });

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
