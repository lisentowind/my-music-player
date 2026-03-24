# 播放器外壳与主题系统升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留现有 macOS 玻璃风的前提下，为当前播放器补齐亮暗模式、预设主题色与自定义主色、统一 Iconify 图标按钮体系，并修复桌面端左右同高与右侧独立滚动，同时升级底部播放器的真实进度条体验。

**Architecture:** 新增 `appearance store + theme lib` 管理外观状态与 CSS 变量应用，继续由 `AppShell` 承担全局布局骨架，用公共 UI 按钮组件统一按钮与图标语义，再将顶部栏、侧栏、页面交互和底部 Dock 接入同一套主题变量。布局上改为“视窗内分区滚动”，播放器逻辑仍由现有 `player store` 提供真实数据与行为。

**Tech Stack:** Vue 3, TypeScript, Pinia, Vue Router, Less, UnoCSS, Vitest, Vue Test Utils, Iconify (`@iconify/vue`)

---

## File Structure

### Existing Files To Modify

- Modify: `package.json` - 增加 Iconify 依赖
- Modify: `src/app/setup-app.ts` - 在应用启动时初始化外观系统
- Modify: `src/styles/theme.less` - 拆分亮暗模式与主题色 token
- Modify: `src/styles/index.less` - 增加全局外观数据属性、按钮、滚动区、滑块、图标按钮样式
- Modify: `src/components/AppShell.vue` - 改为桌面端固定视窗布局与右侧独立滚动结构
- Modify: `src/components/chrome/AppSidebar.vue` - 导航改为图标 + 文字并稳定垂直分布
- Modify: `src/components/chrome/AppTopbar.vue` - 接入顶部栏右侧外观控制区
- Modify: `src/components/dock/PlayerDock.vue` - 接入外观样式、更新 Dock 区域布局
- Modify: `src/components/dock/PlaybackControls.vue` - 文本按钮改为 Iconify 控制按钮
- Modify: `src/components/dock/PlaybackProgress.vue` - 强化真实进度条视觉与拖动反馈
- Modify: `src/components/dock/VolumeControl.vue` - 静音与音量改为图标化控件
- Modify: `src/components/music/TrackTable.vue` - 行内播放 / 喜欢操作图标化
- Modify: `src/views/DiscoverView.vue` - 快捷入口和喜欢按钮改为统一按钮系统
- Modify: `src/views/LikedView.vue` - 排序按钮与列表交互统一为图标化按钮
- Modify: `src/router/routes.ts` - 为侧栏导航补充图标元数据

### New Files To Create

- Create: `src/stores/appearance.ts`
- Create: `src/lib/theme/presets.ts`
- Create: `src/lib/theme/apply-theme.ts`
- Create: `src/components/chrome/AppearanceControls.vue`
- Create: `src/components/ui/IconButton.vue`
- Create: `src/components/ui/PillButton.vue`

### Test Files To Create Or Modify

- Create: `src/stores/__tests__/appearance.test.ts`
- Create: `src/components/chrome/__tests__/AppearanceControls.test.ts`
- Modify: `src/components/chrome/__tests__/AppShell.test.ts`
- Modify: `src/components/dock/__tests__/PlayerDock.test.ts`
- Modify: `src/components/music/__tests__/TrackTable.test.ts`
- Modify: `src/views/__tests__/DiscoverView.test.ts`
- Modify: `src/views/__tests__/LikedView.test.ts`

## Task 1: Build The Appearance Store And Theme Application Layer

**Files:**
- Modify: `src/app/setup-app.ts`
- Create: `src/stores/appearance.ts`
- Create: `src/lib/theme/presets.ts`
- Create: `src/lib/theme/apply-theme.ts`
- Test: `src/stores/__tests__/appearance.test.ts`

- [ ] **Step 1: Write the failing appearance store test**

Create `src/stores/__tests__/appearance.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/stores/__tests__/appearance.test.ts`
Expected: FAIL with missing module `@/stores/appearance`

- [ ] **Step 3: Define theme presets and theme application helpers**

Create `src/lib/theme/presets.ts`:

```ts
export type AppearanceMode = "light" | "dark" | "system";
export type ThemePresetId = "mist" | "ocean" | "peach" | "graphite";

export interface ThemePreset {
  id: ThemePresetId;
  label: string;
  accent: string;
}

export const themePresets: ThemePreset[] = [
  { id: "mist", label: "雾银", accent: "#7c95b5" },
  { id: "ocean", label: "海雾", accent: "#4f8cff" },
  { id: "peach", label: "暖桃", accent: "#ff8a72" },
  { id: "graphite", label: "石墨", accent: "#7b8597" },
];
```

Create `src/lib/theme/apply-theme.ts`:

```ts
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
```

- [ ] **Step 4: Implement the appearance store with persistence**

Create `src/stores/appearance.ts`:

```ts
import { computed, watch } from "vue";
import { defineStore } from "pinia";
import { applyThemeToDocument } from "@/lib/theme/apply-theme";
import { themePresets, type AppearanceMode, type ThemePresetId } from "@/lib/theme/presets";

const STORAGE_KEY = "my-player:appearance";

export const useAppearanceStore = defineStore("appearance", () => {
  const mode = ref<AppearanceMode>("system");
  const presetId = ref<ThemePresetId>("mist");
  const customAccent = ref("");

  const preset = computed(() => themePresets.find(item => item.id === presetId.value) ?? themePresets[0]);
  const resolvedAccent = computed(() => customAccent.value || preset.value.accent);

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

  function resolveMode() {}
  function hydrate() {}
  function apply() {}

  return { mode, presetId, preset, customAccent, resolvedAccent, setMode, setPreset, setCustomAccent, clearCustomAccent, resolveMode, hydrate, apply };
});
```

Implementation requirements:

- `hydrate()` reads persisted state from `localStorage`
- when `mode === "system"`, `resolveMode()` uses `window.matchMedia("(prefers-color-scheme: dark)")`
- `apply()` must pass the resolved concrete mode (`"light"` or `"dark"`) to `applyThemeToDocument()`
- invalid stored preset or invalid color string falls back safely
- `hydrate()` must wrap storage access in `try/catch`; if storage is unavailable or throws, fall back to default light appearance safely
- `apply()` calls `applyThemeToDocument()`
- a `watch()` persists and applies whenever mode / preset / customAccent changes

- [ ] **Step 5: Initialize the appearance store during app setup**

Update `src/app/setup-app.ts` so the appearance store is created after Pinia setup and runs:

```ts
const appearance = useAppearanceStore();
appearance.hydrate();
appearance.apply();
```

- [ ] **Step 6: Run focused and broad validation**

Run: `pnpm exec vitest run src/stores/__tests__/appearance.test.ts`
Expected: PASS

Run: `pnpm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/setup-app.ts src/stores/appearance.ts src/lib/theme/presets.ts src/lib/theme/apply-theme.ts src/stores/__tests__/appearance.test.ts
git commit -m "feat: add appearance store and theme application layer"
```

## Task 2: Establish Theme Tokens And Shared Button Foundations

**Files:**
- Modify: `package.json`
- Modify: `src/styles/theme.less`
- Modify: `src/styles/index.less`
- Create: `src/components/ui/IconButton.vue`
- Create: `src/components/ui/PillButton.vue`
- Test: `src/components/chrome/__tests__/AppearanceControls.test.ts`

- [ ] **Step 1: Write the failing appearance controls render test**

Create `src/components/chrome/__tests__/AppearanceControls.test.ts`:

```ts
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import AppearanceControls from "@/components/chrome/AppearanceControls.vue";

it("renders mode toggles and preset buttons", () => {
  setActivePinia(createPinia());
  const wrapper = mount(AppearanceControls, {
    global: { plugins: [createPinia()] },
  });

  expect(wrapper.get("[data-testid='theme-mode-light']").exists()).toBe(true);
  expect(wrapper.get("[data-testid='theme-preset-ocean']").exists()).toBe(true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/components/chrome/__tests__/AppearanceControls.test.ts`
Expected: FAIL with missing component `AppearanceControls.vue`

- [ ] **Step 3: Add Iconify and define shared token layers**

Run: `pnpm add @iconify/vue`
Expected: `package.json` and lockfile updated with Iconify dependency

Update `src/styles/theme.less` so tokens are split by:

- neutral light tokens
- neutral dark tokens
- accent-derived semantic tokens

At minimum, expose:

```less
:root {
  --theme-accent: #7c95b5;
  --color-bg: #e9eff6;
  --color-surface: rgba(255, 255, 255, 0.72);
  --color-text: #111827;
  --color-accent: var(--theme-accent);
  --color-accent-soft: color-mix(in srgb, var(--theme-accent) 18%, white);
}

:root[data-theme-mode="dark"] {
  --color-bg: #0f1722;
  --color-surface: rgba(24, 31, 44, 0.72);
  --color-text: #edf3fb;
}
```

Implementation note:

- if `color-mix()` support is a concern, compute derived variables in TypeScript and write them as CSS variables from `applyThemeToDocument()`
- do not hard-code accent colors in component styles after this step

- [ ] **Step 4: Add shared UI button components and global utility classes**

Create `src/components/ui/IconButton.vue`:

```vue
<script setup lang="ts">
defineProps<{
  label: string;
  icon: string;
  active?: boolean;
}>();
</script>

<template>
  <button class="icon-button" type="button" :aria-label="label" :data-active="active ? 'true' : 'false'">
    <Icon :icon="icon" width="18" height="18" />
  </button>
</template>
```

Create `src/components/ui/PillButton.vue`:

```vue
<script setup lang="ts">
defineProps<{
  label: string;
  icon?: string;
  active?: boolean;
}>();
</script>

<template>
  <button class="pill-button" type="button" :data-active="active ? 'true' : 'false'">
    <Icon v-if="icon" :icon="icon" width="16" height="16" />
    <span>{{ label }}</span>
  </button>
</template>
```

Update `src/styles/index.less` with shared rules for:

- `.icon-button`
- `.pill-button`
- `.segmented-button`
- `.app-scroll-area`
- theme-aware range thumb and range fill colors

- [ ] **Step 5: Create the appearance controls component**

Create `src/components/chrome/AppearanceControls.vue` using the new store and button components. It should include:

- light / dark / system mode buttons
- preset color buttons
- hidden native color input triggered by a palette button
- clear custom accent button that only appears when `customAccent` exists

Compatibility requirement:

- if the runtime does not support `<input type="color">`, hide or disable the custom accent entry and keep preset color buttons available as the fallback path

Keep stable selectors:

- `[data-testid="theme-mode-system"]`
- `[data-testid="theme-mode-light"]`
- `[data-testid="theme-mode-dark"]`
- `[data-testid="theme-preset-<id>"]`
- `[data-testid="theme-custom-accent"]`

- [ ] **Step 6: Run focused and broad validation**

Run: `pnpm exec vitest run src/components/chrome/__tests__/AppearanceControls.test.ts`
Expected: PASS

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml src/styles/theme.less src/styles/index.less src/components/ui/IconButton.vue src/components/ui/PillButton.vue src/components/chrome/AppearanceControls.vue src/components/chrome/__tests__/AppearanceControls.test.ts
git commit -m "feat: add theme tokens and shared icon button foundations"
```

## Task 3: Rebuild The Shell For Fixed Height And Right-Side Scrolling

**Files:**
- Modify: `src/components/AppShell.vue`
- Modify: `src/components/chrome/AppSidebar.vue`
- Modify: `src/components/chrome/AppTopbar.vue`
- Modify: `src/router/routes.ts`
- Modify: `src/components/chrome/__tests__/AppShell.test.ts`

- [ ] **Step 1: Write the failing shell layout test**

Extend `src/components/chrome/__tests__/AppShell.test.ts`:

```ts
it("renders the fixed shell regions for sidebar and scrollable content", async () => {
  const wrapper = mount(AppShell, { global: { plugins: [router, pinia] } });
  expect(wrapper.get("[data-testid='app-shell-sidebar']").exists()).toBe(true);
  expect(wrapper.get("[data-testid='app-shell-scroll']").exists()).toBe(true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts`
Expected: FAIL because the fixed shell test ids do not exist yet

- [ ] **Step 3: Add icon metadata to routes for sidebar rendering**

Update `src/router/routes.ts` so each visible route includes a stable icon:

```ts
meta: {
  title: "推荐",
  icon: "solar:music-notes-linear",
  showInSidebar: true,
}
```

Use one icon per route and keep labels unchanged.

- [ ] **Step 4: Refactor AppShell into fixed-height shell regions**

Update `src/components/AppShell.vue` to this structure:

```vue
<template>
  <div class="app-shell" data-testid="app-shell-root">
    <AppSidebar class="app-shell__sidebar" data-testid="app-shell-sidebar" />
    <div class="app-shell__content">
      <AppTopbar />
      <main class="app-shell__scroll app-scroll-area" data-testid="app-shell-scroll">
        <RouterView />
      </main>
    </div>
    <PlayerDock />
  </div>
</template>
```

Implementation requirements:

- desktop uses fixed viewport height
- content area reserves bottom space for Dock
- `main` is the right-side scroll area
- mobile breakpoints may fall back to stacked layout

- [ ] **Step 5: Update sidebar and topbar for the new shell contract**

Update `src/components/chrome/AppSidebar.vue`:

- render route icon + label
- use a centered nav region on desktop
- keep the brand block pinned above nav items

Update `src/components/chrome/AppTopbar.vue`:

- replace the current static status cluster with `AppearanceControls`
- preserve current title derivation from route meta

- [ ] **Step 6: Run focused and broad validation**

Run: `pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts`
Expected: PASS

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/AppShell.vue src/components/chrome/AppSidebar.vue src/components/chrome/AppTopbar.vue src/router/routes.ts src/components/chrome/__tests__/AppShell.test.ts
git commit -m "feat: rebuild shell for fixed-height layout and appearance controls"
```

## Task 4: Convert Page Interactions To Real Icon Buttons

**Files:**
- Modify: `src/components/music/TrackTable.vue`
- Modify: `src/views/DiscoverView.vue`
- Modify: `src/views/LikedView.vue`
- Modify: `src/components/music/__tests__/TrackTable.test.ts`
- Modify: `src/views/__tests__/DiscoverView.test.ts`
- Modify: `src/views/__tests__/LikedView.test.ts`

- [ ] **Step 1: Write the failing interaction assertions**

Update `src/components/music/__tests__/TrackTable.test.ts`:

```ts
it("renders icon-based play and like buttons with accessible labels", () => {
  const wrapper = mount(TrackTable, { props: { tracks: rows, likedIds: [], activeTrackId: null } });
  expect(wrapper.get("[data-testid='track-play-track-1']").attributes("aria-label")).toContain("播放");
  expect(wrapper.get("[data-testid='track-like-track-1']").attributes("aria-label")).toContain("喜欢");
});
```

Update `src/views/__tests__/DiscoverView.test.ts` and `src/views/__tests__/LikedView.test.ts` to assert that:

- discover quick actions still call store methods
- liked sort controls remain clickable after being converted into button components

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run src/components/music/__tests__/TrackTable.test.ts src/views/__tests__/DiscoverView.test.ts src/views/__tests__/LikedView.test.ts`
Expected: FAIL because the new selectors and button semantics are not implemented yet

- [ ] **Step 3: Convert the track table row actions**

Update `src/components/music/TrackTable.vue`:

- replace the text-only play button with `IconButton` or a compact button variant
- replace the text-only like button with heart icon + active state
- keep stable `data-testid` values in the pattern:
  - `track-play-<trackId>`
  - `track-like-<trackId>`

Example button shape:

```vue
<IconButton
  :label="`播放 ${track.title}`"
  icon="solar:play-line-duotone"
  :data-testid="`track-play-${track.id}`"
  @click="playTrack(track.id)"
/>
```

- [ ] **Step 4: Convert discover and liked view controls**

Update `src/views/DiscoverView.vue`:

- quick card main actions remain buttons
- like buttons use icon + text instead of pure text
- optional decorative labels remain plain text, not fake controls

Update `src/views/LikedView.vue`:

- sort buttons use a shared segmented or pill button style
- if adding icons, keep labels visible for readability

- [ ] **Step 5: Run focused and broad validation**

Run: `pnpm exec vitest run src/components/music/__tests__/TrackTable.test.ts src/views/__tests__/DiscoverView.test.ts src/views/__tests__/LikedView.test.ts`
Expected: PASS

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/music/TrackTable.vue src/views/DiscoverView.vue src/views/LikedView.vue src/components/music/__tests__/TrackTable.test.ts src/views/__tests__/DiscoverView.test.ts src/views/__tests__/LikedView.test.ts
git commit -m "feat: convert page interactions to icon-based controls"
```

## Task 5: Upgrade The Player Dock To Fully Themed Real Controls

**Files:**
- Modify: `src/components/dock/PlayerDock.vue`
- Modify: `src/components/dock/PlaybackControls.vue`
- Modify: `src/components/dock/PlaybackProgress.vue`
- Modify: `src/components/dock/VolumeControl.vue`
- Modify: `src/components/dock/__tests__/PlayerDock.test.ts`

- [ ] **Step 1: Write the failing Dock control assertions**

Update `src/components/dock/__tests__/PlayerDock.test.ts`:

```ts
it("renders icon controls and a seekable themed progress bar", async () => {
  const wrapper = mount(PlayerDock, { global: { plugins: [pinia] } });
  expect(wrapper.get("[data-testid='player-dock-prev']").attributes("aria-label")).toBe("上一首");
  expect(wrapper.get("[data-testid='player-dock-progress']").element.tagName).toBe("INPUT");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/components/dock/__tests__/PlayerDock.test.ts`
Expected: FAIL because the Dock still uses text-heavy controls or lacks the new semantics

- [ ] **Step 3: Convert transport and volume controls to Iconify**

Update `src/components/dock/PlaybackControls.vue`:

- previous / next / play-pause become icon buttons
- mode control uses icon + short label
- keep existing emitted events unchanged

Update `src/components/dock/VolumeControl.vue`:

- mute becomes icon button
- volume label remains visible as text

- [ ] **Step 4: Refine the progress bar and Dock surface**

Update `src/components/dock/PlaybackProgress.vue`:

- keep real `input[type="range"]`
- compute a CSS variable for fill width based on `currentTime / duration`
- add a stronger hover / active thumb state
- show a clearer disabled appearance when `duration <= 0`

Update `src/components/dock/PlayerDock.vue`:

- align meta / center / aside sections to the new button system
- make color and shadows consume the theme variables instead of local hard-coded blues
- preserve the error banner and track metadata

- [ ] **Step 5: Run focused and broad validation**

Run: `pnpm exec vitest run src/components/dock/__tests__/PlayerDock.test.ts`
Expected: PASS

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/dock/PlayerDock.vue src/components/dock/PlaybackControls.vue src/components/dock/PlaybackProgress.vue src/components/dock/VolumeControl.vue src/components/dock/__tests__/PlayerDock.test.ts
git commit -m "feat: upgrade player dock to themed icon controls"
```

## Task 6: Finish Integration And Verify Desktop Behavior

**Files:**
- Modify: `src/styles/index.less`
- Modify: `src/components/AppShell.vue`
- Modify: `src/components/chrome/AppSidebar.vue`
- Modify: `src/components/chrome/AppTopbar.vue`
- Modify: `src/components/dock/PlayerDock.vue`

- [ ] **Step 1: Add final validation coverage for shell and theme behavior**

If needed, extend existing tests with one last assertion that the root element receives the expected theme mode dataset after hydration:

```ts
expect(document.documentElement.dataset.themeMode).toBe("dark");
```

Only add this assertion if it closes a real regression gap; do not create redundant tests.

- [ ] **Step 2: Run the full delivery suite**

Run: `pnpm test`
Expected: PASS

Run: `pnpm lint`
Expected: PASS

Run: `pnpm typecheck`
Expected: PASS

Run: `pnpm build:web`
Expected: PASS

- [ ] **Step 3: Manual verification checklist**

Verify in `pnpm dev` or `pnpm tauri:dev`:

- 顶部栏右侧可以切换亮色 / 暗色 / 跟随系统
- 预设主题色切换后，按钮、活动态、滑块和 Dock 高亮同步变化
- 自定义主色生效且可清除
- 当浏览器或运行环境不允许读取 `localStorage` 时，界面安全回退到默认亮色主题
- 桌面端右侧独立滚动，左侧不随内容长度错位
- 侧栏导航显示图标 + 文字
- 发现页 / 喜欢页 / 表格 / Dock 的高频交互都已使用真实按钮
- 底部播放器进度条与真实播放时间同步，支持拖动 seek

- [ ] **Step 4: Commit**

```bash
git add src/styles/index.less src/components/AppShell.vue src/components/chrome/AppSidebar.vue src/components/chrome/AppTopbar.vue src/components/dock/PlayerDock.vue
git commit -m "test: verify themed shell refresh end to end"
```
