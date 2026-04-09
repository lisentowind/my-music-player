# Player Shell Theme Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重做播放器桌面壳层和视觉体系，支持固定侧栏/右侧滚动、Howler 播放底层、Iconify 图标、亮暗主题与主题色设置。

**Architecture:** 新增主题 store 和一组基础 UI 组件，以 CSS variables 驱动全局主题；壳层布局改成固定导航与固定头部；播放器底层通过 `Howler.js` 适配层替换当前原生音频实现，对业务 store 保持稳定接口。

**Tech Stack:** Vue 3, TypeScript, Pinia, Vue Router, Vitest, Vue Test Utils, Less, Iconify, Howler.js, Tauri

---

## File Structure

### Existing Files To Modify

- Modify: `package.json`
- Modify: `src/components/AppShell.vue`
- Modify: `src/components/chrome/AppSidebar.vue`
- Modify: `src/components/chrome/AppTopbar.vue`
- Modify: `src/components/dock/PlayerDock.vue`
- Modify: `src/components/dock/PlaybackControls.vue`
- Modify: `src/components/dock/PlaybackProgress.vue`
- Modify: `src/components/dock/VolumeControl.vue`
- Modify: `src/lib/player/audio.ts`
- Modify: `src/stores/player.ts`
- Modify: `src/styles/theme.less`
- Modify: `src/styles/index.less`
- Modify: `src/views/DiscoverView.vue`
- Modify: `src/views/LikedView.vue`
- Modify: `src/views/ProfileView.vue`
- Modify: `src/components/chrome/__tests__/AppShell.test.ts`
- Modify: `src/components/dock/__tests__/PlayerDock.test.ts`
- Modify: `src/stores/__tests__/player.test.ts`

### New Files To Create

- Create: `src/stores/theme.ts`
- Create: `src/components/ui/UiButton.vue`
- Create: `src/components/ui/UiIconButton.vue`
- Create: `src/components/ui/UiThemeToggle.vue`
- Create: `src/components/ui/UiThemePalette.vue`
- Create: `src/components/ui/UiSectionCard.vue`

### Test Files To Create

- Test: `src/stores/__tests__/theme.test.ts`

## Task 1: Add failing tests for theme state

**Files:**
- Create: `src/stores/__tests__/theme.test.ts`
- Create: `src/stores/theme.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useThemeStore } from "@/stores/theme";

describe("theme store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("switches between preset and custom accents", () => {
    const theme = useThemeStore();
    theme.setPresetAccent("mint");
    expect(theme.accent).toBeTruthy();
    theme.setCustomAccent("#ff5500");
    expect(theme.presetAccentId).toBe("");
    expect(theme.accent).toBe("#ff5500");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/stores/__tests__/theme.test.ts`
Expected: FAIL because `@/stores/theme` does not exist

- [ ] **Step 3: Write minimal implementation**

Create a theme store with mode, resolvedMode, presetAccentId, accent, `setMode`, `setPresetAccent`, `setCustomAccent`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/stores/__tests__/theme.test.ts`
Expected: PASS

## Task 2: Add failing tests for shell theme controls and fixed layout markers

**Files:**
- Modify: `src/components/chrome/__tests__/AppShell.test.ts`
- Modify: `src/components/AppShell.vue`
- Modify: `src/components/chrome/AppTopbar.vue`

- [ ] **Step 1: Write the failing test**

Add assertions for:

- `data-testid="app-shell-sidebar"` exists
- `data-testid="app-shell-scroller"` exists
- `data-testid="theme-mode-toggle"` exists
- `data-testid="theme-preset-*"` can change theme accent

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts`
Expected: FAIL because the new layout hooks and theme controls do not exist

- [ ] **Step 3: Write minimal implementation**

Add new shell structure and topbar theme controls.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts`
Expected: PASS

## Task 3: Add failing tests for dock icon controls

**Files:**
- Modify: `src/components/dock/__tests__/PlayerDock.test.ts`
- Modify: `src/components/dock/PlaybackControls.vue`
- Modify: `src/components/dock/VolumeControl.vue`
- Modify: `src/components/dock/PlayerDock.vue`

- [ ] **Step 1: Write the failing test**

Replace text-coupled assertions with:

- icon buttons still expose same `data-testid`
- mute/play/mode buttons have correct `aria-label`
- dock shows compact mode label and icon action cluster

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/dock/__tests__/PlayerDock.test.ts`
Expected: FAIL because dock still renders text buttons

- [ ] **Step 3: Write minimal implementation**

Refactor dock controls to `UiIconButton` + Iconify icons.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/dock/__tests__/PlayerDock.test.ts`
Expected: PASS

## Task 4: Add failing tests for player adapter behavior

**Files:**
- Modify: `src/stores/__tests__/player.test.ts`
- Modify: `src/lib/player/audio.ts`
- Modify: `src/stores/player.ts`

- [ ] **Step 1: Write the failing test**

Add a test that verifies adapter events update store duration/currentTime and that `setVolume` / `toggleMute` delegate correctly through the adapter.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/stores/__tests__/player.test.ts`
Expected: FAIL because the current audio layer does not expose the new adapter behavior

- [ ] **Step 3: Write minimal implementation**

Implement a Howler-backed adapter while preserving store behavior.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/stores/__tests__/player.test.ts`
Expected: PASS

## Task 5: Redesign shared theme tokens and reusable components

**Files:**
- Modify: `src/styles/theme.less`
- Modify: `src/styles/index.less`
- Create: `src/components/ui/UiButton.vue`
- Create: `src/components/ui/UiIconButton.vue`
- Create: `src/components/ui/UiThemeToggle.vue`
- Create: `src/components/ui/UiThemePalette.vue`
- Create: `src/components/ui/UiSectionCard.vue`

- [ ] **Step 1: Write the failing shell/theme tests first**
- [ ] **Step 2: Implement tokenized light/dark/accent theme system**
- [ ] **Step 3: Build reusable button/icon/theme components**
- [ ] **Step 4: Re-run shell/theme tests**

## Task 6: Rebuild shell, pages, and dock visuals

**Files:**
- Modify: `src/components/AppShell.vue`
- Modify: `src/components/chrome/AppSidebar.vue`
- Modify: `src/components/chrome/AppTopbar.vue`
- Modify: `src/components/dock/PlayerDock.vue`
- Modify: `src/views/DiscoverView.vue`
- Modify: `src/views/LikedView.vue`
- Modify: `src/views/ProfileView.vue`

- [ ] **Step 1: Keep structure aligned with fixed sidebar + topbar + scrollable main**
- [ ] **Step 2: Redesign discover first, then liked/profile**
- [ ] **Step 3: Update dock spacing, card hierarchy, and theme surfaces**
- [ ] **Step 4: Re-run relevant component/view tests**

## Task 7: Verification

**Files:**
- Modify: as needed from previous tasks

- [ ] **Step 1: Run targeted tests**

Run:

```bash
pnpm exec vitest run src/stores/__tests__/theme.test.ts src/components/chrome/__tests__/AppShell.test.ts src/components/dock/__tests__/PlayerDock.test.ts src/stores/__tests__/player.test.ts
```

Expected: PASS

- [ ] **Step 2: Run full test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS
