# Liquid Glass Music Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前 starter 重构成一个 macOS 风格的液态玻璃桌面音乐播放器，包含推荐、我喜欢、个人中心三页，以及支持真实 mock 音频播放的全局底部 Dock。

**Architecture:** 前端继续使用 Vue 3 + Pinia + Vue Router，新增本地 mock 媒体库、纯函数播放规则模块与集中式音频控制 store。UI 以 Less + CSS variables 建立统一玻璃设计 token，再用可复用的 chrome、music、dock 组件拼出三页与全局播放器。

**Tech Stack:** Vue 3, TypeScript, Vue Router, Pinia, Vite, Vitest, Vue Test Utils, Less, UnoCSS, HTMLAudioElement, Tauri

---

## File Structure

### Existing Files To Modify

- Modify: `package.json` - 增加单元测试依赖与脚本
- Modify: `vite.config.ts` - 接入 Vitest 配置
- Modify: `tsconfig.json` - 纳入测试文件类型
- Modify: `src/App.vue` - 挂载全局应用外壳
- Modify: `src/components/AppShell.vue` - 重构为音乐播放器主框架或迁移职责
- Modify: `src/router/routes.ts` - 替换为推荐 / 我喜欢 / 个人中心路由
- Modify: `src/styles/theme.less` - 建立液态玻璃设计 token
- Modify: `src/styles/index.less` - 重写全局背景、字体和基础元素样式

### New Files To Create

- Create: `public/media/sample-track-01.mp3`
- Create: `public/media/sample-track-02.mp3`
- Create: `public/media/sample-track-03.mp3`
- Create: `public/covers/cover-dawn.svg`
- Create: `public/covers/cover-glacier.svg`
- Create: `public/covers/cover-orbit.svg`
- Create: `public/avatars/profile-main.svg`
- Create: `src/test/setup.ts`
- Create: `src/types/music.ts`
- Create: `src/lib/player/rules.ts`
- Create: `src/lib/player/audio.ts`
- Create: `src/lib/player/format.ts`
- Create: `src/data/music-library.ts`
- Create: `src/data/profile.ts`
- Create: `src/stores/player.ts`
- Create: `src/components/chrome/AppSidebar.vue`
- Create: `src/components/chrome/AppTopbar.vue`
- Create: `src/components/chrome/GlassPanel.vue`
- Create: `src/components/music/SectionHeader.vue`
- Create: `src/components/music/AlbumCard.vue`
- Create: `src/components/music/TrackTable.vue`
- Create: `src/components/music/MetricCard.vue`
- Create: `src/components/music/RecentPlayList.vue`
- Create: `src/components/dock/PlayerDock.vue`
- Create: `src/components/dock/PlaybackProgress.vue`
- Create: `src/components/dock/PlaybackControls.vue`
- Create: `src/components/dock/VolumeControl.vue`
- Create: `src/views/DiscoverView.vue`
- Create: `src/views/LikedView.vue`
- Create: `src/views/ProfileView.vue`

### Test Files To Create

- Test: `src/lib/player/__tests__/rules.test.ts`
- Test: `src/data/__tests__/music-library.test.ts`
- Test: `src/stores/__tests__/player.test.ts`
- Test: `src/components/chrome/__tests__/AppShell.test.ts`
- Test: `src/components/music/__tests__/TrackTable.test.ts`
- Test: `src/views/__tests__/DiscoverView.test.ts`
- Test: `src/views/__tests__/ProfileView.test.ts`
- Test: `src/components/dock/__tests__/PlayerDock.test.ts`

## Task 1: Add Test Harness And Playback Rule Foundation

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`
- Create: `src/test/setup.ts`
- Create: `src/lib/player/rules.ts`
- Test: `src/lib/player/__tests__/rules.test.ts`

- [ ] **Step 1: Write the failing playback rule test**

```ts
import { describe, expect, it } from "vitest";
import { resolvePreviousAction } from "@/lib/player/rules";

describe("resolvePreviousAction", () => {
  it("rewinds to the beginning when current time is over 3 seconds", () => {
    expect(resolvePreviousAction({ currentIndex: 2, currentTime: 8, trackCount: 5 })).toEqual({
      nextIndex: 2,
      shouldRestart: true,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails because the harness is missing**

Run: `pnpm exec vitest run src/lib/player/__tests__/rules.test.ts`
Expected: FAIL with missing `vitest` package or missing module `@/lib/player/rules`

- [ ] **Step 3: Add the minimal unit test harness**

Update `package.json` to include:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@vue/test-utils": "^2.4.6",
    "happy-dom": "^17.6.3",
    "vitest": "^3.2.4"
  }
}
```

Update `tsconfig.json` incrementally instead of replacing the whole file:

```json
{
  "compilerOptions": {
    "...keepExistingCompilerOptions": true,
    "types": ["vitest/globals"]
  },
  "include": [
    "...keepExistingIncludeEntries": true,
    "src/**/__tests__/**/*.ts"
  ]
}
```

Implementation note:

- keep all existing `compilerOptions` such as `target`, `module`, `moduleResolution`, `baseUrl`, `paths`, and `references`
- only append `vitest/globals` to `compilerOptions.types`
- only append the test glob to the existing `include` array

Update `vite.config.ts` to preserve the existing Tauri-specific config while adding Vitest support:

```ts
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vitest/config";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [vue(), UnoCSS()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
}));
```

Create `src/test/setup.ts`:

```ts
import { afterEach, beforeEach, vi } from "vitest";

class FakeAudio {
  src = "";
  currentTime = 0;
  duration = 180;
  volume = 1;
  muted = false;
  paused = true;
  private listeners = new Map<string, Set<() => void>>();

  play = vi.fn(async () => {
    this.paused = false;
  });

  pause = vi.fn(() => {
    this.paused = true;
  });

  load = vi.fn(() => undefined);

  addEventListener(type: string, handler: () => void) {
    const bucket = this.listeners.get(type) ?? new Set();
    bucket.add(handler);
    this.listeners.set(type, bucket);
  }

  removeEventListener(type: string, handler: () => void) {
    this.listeners.get(type)?.delete(handler);
  }

  emit(type: string) {
    this.listeners.get(type)?.forEach((handler) => handler());
  }
}

beforeEach(() => {
  vi.stubGlobal("Audio", FakeAudio);
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});
```

Use this fake explicitly in store tests by injecting the same instance the store will consume:

```ts
const audio = new Audio() as FakeAudio;
configurePlayerAudioFactory(() => audio);
audio.duration = 213;
audio.emit("loadedmetadata");
audio.emit("timeupdate");
audio.emit("ended");
```

- [ ] **Step 4: Implement the minimal playback rule module**

Create `src/lib/player/rules.ts`:

```ts
import type { PlaybackMode, Track } from "@/types/music";

export function resolvePreviousAction(input: {
  currentIndex: number;
  currentTime: number;
  trackCount: number;
}) {
  if (input.currentTime > 3 || input.currentIndex === 0) {
    return { nextIndex: input.currentIndex, shouldRestart: true };
  }

  return { nextIndex: input.currentIndex - 1, shouldRestart: false };
}

export function resolveNextAction(input: {
  currentIndex: number;
  trackCount: number;
  mode: PlaybackMode;
}) {
  const atLastTrack = input.currentIndex === input.trackCount - 1;

  if (input.mode === "repeat-all") {
    return { nextIndex: atLastTrack ? 0 : input.currentIndex + 1, shouldPlay: true };
  }

  if (atLastTrack) {
    return { nextIndex: input.currentIndex, shouldPlay: false };
  }

  return { nextIndex: input.currentIndex + 1, shouldPlay: true };
}

export function resolveEndedAction(input: {
  currentIndex: number;
  trackCount: number;
  mode: PlaybackMode;
}) {
  if (input.mode === "repeat-one") {
    return { nextIndex: input.currentIndex, shouldReplay: true, shouldPlay: true };
  }

  return { ...resolveNextAction(input), shouldReplay: false };
}

export function resolveErrorRecovery(input: {
  currentIndex: number;
  trackCount: number;
  mode: PlaybackMode;
}) {
  const next = resolveNextAction(input);
  return {
    nextIndex: next.nextIndex,
    shouldSkip: next.shouldPlay,
  };
}

export function resolveQueueSelection(input: {
  queue: Track[];
  trackId: string;
}) {
  const nextIndex = input.queue.findIndex((track) => track.id === input.trackId);
  return {
    queue: input.queue,
    nextIndex: nextIndex >= 0 ? nextIndex : 0,
    found: nextIndex >= 0,
  };
}
```

Store fallback rule: if `resolveQueueSelection().found === false` during `playContext()`, assign the new queue, keep `currentIndex = 0`, and leave `isPlaying = false` until the user selects a valid track.

- [ ] **Step 5: Run the focused test and then the full baseline**

Run: `pnpm exec vitest run src/lib/player/__tests__/rules.test.ts`
Expected: PASS

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all commands PASS

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.ts tsconfig.json src/test/setup.ts src/lib/player/rules.ts src/lib/player/__tests__/rules.test.ts
git commit -m "test: add vitest harness and playback rule foundation"
```

## Task 2: Build Mock Library Models And Static Media Metadata

**Files:**
- Create: `src/types/music.ts`
- Create: `src/data/music-library.ts`
- Create: `src/data/profile.ts`
- Create: `public/covers/cover-dawn.svg`
- Create: `public/covers/cover-glacier.svg`
- Create: `public/covers/cover-orbit.svg`
- Create: `public/avatars/profile-main.svg`
- Create: `public/media/sample-track-01.mp3`
- Create: `public/media/sample-track-02.mp3`
- Create: `public/media/sample-track-03.mp3`
- Test: `src/data/__tests__/music-library.test.ts`

- [ ] **Step 1: Write the failing data contract test**

```ts
import { describe, expect, it } from "vitest";
import { featuredAlbums, likedTrackIds, tracks } from "@/data/music-library";

describe("music library", () => {
  it("uses root-relative media URLs for every track", () => {
    expect(tracks.every((track) => track.audioSrc.startsWith("/media/"))).toBe(true);
  });

  it("keeps liked tracks in sync with the exported liked id set", () => {
    const likedIds = tracks.filter((track) => track.liked).map((track) => track.id);
    expect(likedIds).toEqual(likedTrackIds);
  });

  it("provides featured albums for the discover page", () => {
    expect(featuredAlbums.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/data/__tests__/music-library.test.ts`
Expected: FAIL with missing module `@/data/music-library`

- [ ] **Step 3: Define the core music types**

Create `src/types/music.ts`:

```ts
export type PlaybackMode = "sequential" | "repeat-one" | "repeat-all";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverSrc: string;
  audioSrc: string;
  liked: boolean;
  tags: string[];
}
```

- [ ] **Step 4: Add the mock library and profile seed data**

Create `src/data/music-library.ts` with:

```ts
export const tracks: Track[] = [
  {
    id: "track-dawn",
    title: "晨光之前",
    artist: "Luma",
    album: "Air Archive",
    duration: 213,
    coverSrc: "/covers/cover-dawn.svg",
    audioSrc: "/media/sample-track-01.mp3",
    liked: true,
    tags: ["氛围", "清晨"],
  },
];

export const likedTrackIds = tracks.filter((track) => track.liked).map((track) => track.id);
export const featuredAlbums = tracks.slice(0, 3);
```

Create `src/data/profile.ts` with lightweight profile cards and metrics derived from the same tag vocabulary.

- [ ] **Step 5: Add static assets**

Create three SVG cover files and one SVG avatar with gradient-based artwork.

Add three small mock audio files under `public/media/`, keeping filenames stable and root-relative.

- [ ] **Step 6: Run the focused test and full validation**

Run: `pnpm exec vitest run src/data/__tests__/music-library.test.ts`
Expected: PASS

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/types/music.ts src/data/music-library.ts src/data/profile.ts src/data/__tests__/music-library.test.ts public/covers public/avatars public/media
git commit -m "feat: add mock music library assets and metadata"
```

## Task 3: Implement The Global Player Store With Audio Lifecycle

**Files:**
- Modify: `src/lib/player/rules.ts`
- Create: `src/lib/player/audio.ts`
- Create: `src/lib/player/format.ts`
- Create: `src/stores/player.ts`
- Test: `src/stores/__tests__/player.test.ts`

- [ ] **Step 1: Write the failing player store test**

```ts
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayerStore } from "@/stores/player";

describe("player store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("switches to the clicked track and marks playback as active", async () => {
    const store = usePlayerStore();
    await store.playTrackById("track-dawn");
    expect(store.currentTrack?.id).toBe("track-dawn");
    expect(store.isPlaying).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/stores/__tests__/player.test.ts`
Expected: FAIL with missing module `@/stores/player`

- [ ] **Step 3: Extend playback rule helpers before writing the store**

Add to `src/lib/player/rules.ts` tests for all spec-critical branches, then implement or refine:

```ts
expect(resolveNextAction({ currentIndex: 2, trackCount: 3, mode: "sequential" })).toEqual({
  nextIndex: 2,
  shouldPlay: false,
});

expect(resolveEndedAction({ currentIndex: 2, trackCount: 3, mode: "repeat-all" })).toEqual({
  nextIndex: 0,
  shouldReplay: false,
  shouldPlay: true,
});
```

- [ ] **Step 4: Add an injectable audio adapter for stable tests**

Create `src/lib/player/audio.ts`:

```ts
export interface AudioLike {
  src: string;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  play(): Promise<void>;
  pause(): void;
  load(): void;
  addEventListener(type: string, handler: () => void): void;
  removeEventListener(type: string, handler: () => void): void;
}

type AudioFactory = () => AudioLike;

let currentFactory: AudioFactory = () => new Audio() as AudioLike;

export function createPlayerAudio() {
  return currentFactory();
}

export function configurePlayerAudioFactory(factory: AudioFactory) {
  currentFactory = factory;
}
```

- [ ] **Step 5: Implement the store with a single shared audio instance and explicit public API**

Create `src/stores/player.ts` with:

```ts
export const usePlayerStore = defineStore("player", () => {
  const queue = ref(tracks);
  const currentIndex = ref(0);
  const isPlaying = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(0.72);
  const muted = ref(false);
  const mode = ref<PlaybackMode>("sequential");
  const likedIds = ref(new Set(likedTrackIds));
  const recentPlayIds = ref<string[]>([]);
  const errorMessage = ref("");
  const errorTrackId = ref<string | null>(null);
  const currentTrack = computed(() => queue.value[currentIndex.value] ?? null);

  function playContext(nextQueue: Track[], trackId: string) {}
  async function playTrackById(trackId: string) {}
  async function togglePlay() {}
  async function playNext() {}
  async function playPrevious() {}
  function seekTo(nextTime: number) {}
  function setVolume(nextVolume: number) {}
  function toggleMute() {}
  function cycleMode() {}
  function toggleLike(trackId: string) {}
  function clearPlaybackError() {}

  return {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    mode,
    likedIds,
    recentPlayIds,
    errorMessage,
    errorTrackId,
    playContext,
    playTrackById,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    cycleMode,
    toggleLike,
    clearPlaybackError,
  };
});
```

Implementation rules:

- lazily create the shared audio via `createPlayerAudio()`
- bind `loadedmetadata`, `timeupdate`, `ended`, and `error` once
- `seekTo()` only更新播放位置，不切换 `isPlaying`
- `playContext()` 必须按 spec 切换上下文列表并从目标曲目开始播放
- 成功开始播放新歌曲后调用 `clearPlaybackError()`
- `error` 事件时记录 `errorTrackId` 和 `errorMessage`，再按 `resolveErrorRecovery()` 决定是否尝试下一首
- `playNext()` 在顺序模式最后一首时停在末尾并将 `isPlaying` 设为 `false`

- [ ] **Step 6: Add focused formatting helpers**

Create `src/lib/player/format.ts`:

```ts
export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}
```

- [ ] **Step 7: Run focused and broad validation**

Run: `pnpm exec vitest run src/lib/player/__tests__/rules.test.ts src/stores/__tests__/player.test.ts`
Expected: PASS

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/lib/player/rules.ts src/lib/player/audio.ts src/lib/player/format.ts src/stores/player.ts src/stores/__tests__/player.test.ts
git commit -m "feat: add global audio player store"
```

## Task 4: Rebuild Routing And Application Chrome

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/AppShell.vue`
- Modify: `src/router/routes.ts`
- Create: `src/components/chrome/AppSidebar.vue`
- Create: `src/components/chrome/AppTopbar.vue`
- Create: `src/components/chrome/GlassPanel.vue`
- Test: `src/components/chrome/__tests__/AppShell.test.ts`
- Create: `src/views/DiscoverView.vue`
- Create: `src/views/LikedView.vue`
- Create: `src/views/ProfileView.vue`

- [ ] **Step 1: Write a failing shell navigation test**

Create `src/components/chrome/__tests__/AppShell.test.ts` with a routing smoke assertion:

```ts
import { mount } from "@vue/test-utils";
import { createRouter, createWebHashHistory } from "vue-router";
import AppShell from "@/components/AppShell.vue";
import { routes } from "@/router/routes";

it("renders the new music product navigation labels", async () => {
  const router = createRouter({ history: createWebHashHistory(), routes });
  router.push("/");
  await router.isReady();
  const wrapper = mount(AppShell, { global: { plugins: [router] } });
  expect(wrapper.text()).toContain("推荐");
  expect(wrapper.text()).toContain("我喜欢");
  expect(wrapper.text()).toContain("个人中心");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts`
Expected: FAIL because the shell still renders `Home` and `About`

- [ ] **Step 3: Replace the starter shell with product chrome**

Implement:

- `src/components/chrome/AppSidebar.vue` for the left glass navigation
- `src/components/chrome/AppTopbar.vue` for the page title and status area
- `src/components/chrome/GlassPanel.vue` as a reusable translucent card wrapper

Refactor `src/components/AppShell.vue` to:

```vue
<template>
  <div class="player-app">
    <AppSidebar />
    <div class="player-app__content">
      <AppTopbar />
      <RouterView />
    </div>
  </div>
</template>
```

Update routes to:

```ts
export const routes: RouteRecordRaw[] = [
  { path: "/", name: "discover", component: DiscoverView },
  { path: "/liked", name: "liked", component: LikedView },
  { path: "/profile", name: "profile", component: ProfileView },
];
```

- [ ] **Step 4: Add the minimal placeholder content for all three views**

Create view-level scaffolds with stable section ids and titles, but keep detailed business UI for later tasks.

- [ ] **Step 5: Run the navigation test and baseline**

Run: `pnpm exec vitest run src/components/chrome/__tests__/AppShell.test.ts`
Expected: PASS

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/App.vue src/components/AppShell.vue src/components/chrome src/router/routes.ts src/views/DiscoverView.vue src/views/LikedView.vue src/views/ProfileView.vue src/components/chrome/__tests__/AppShell.test.ts
git commit -m "feat: rebuild app shell and music routes"
```

## Task 5: Establish The Liquid Glass Design System And Shared Music Components

**Files:**
- Modify: `src/styles/theme.less`
- Modify: `src/styles/index.less`
- Create: `src/components/music/SectionHeader.vue`
- Create: `src/components/music/AlbumCard.vue`
- Create: `src/components/music/TrackTable.vue`
- Create: `src/components/music/MetricCard.vue`
- Create: `src/components/music/RecentPlayList.vue`
- Test: `src/components/music/__tests__/TrackTable.test.ts`

- [ ] **Step 1: Write the failing track table interaction test**

```ts
import { mount } from "@vue/test-utils";
import TrackTable from "@/components/music/TrackTable.vue";
import { tracks } from "@/data/music-library";

it("emits play when clicking a row action", async () => {
  const wrapper = mount(TrackTable, {
    props: { tracks, activeTrackId: "", likedIds: new Set<string>() },
  });

  await wrapper.get("[data-track-row]").trigger("click");
  expect(wrapper.emitted("play")?.length).toBe(1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/components/music/__tests__/TrackTable.test.ts`
Expected: FAIL with missing component/module

- [ ] **Step 3: Replace starter tokens with the liquid glass system**

Update `src/styles/theme.less` with tokens such as:

```less
:root {
  --bg-base: #f7f9fc;
  --bg-ambient-blue: rgba(114, 210, 255, 0.18);
  --glass-surface: rgba(255, 255, 255, 0.68);
  --glass-border: rgba(255, 255, 255, 0.46);
  --text-primary: rgba(24, 31, 44, 0.92);
  --text-secondary: rgba(42, 46, 50, 0.64);
  --accent-blue: #72d2ff;
}
```

Update `src/styles/index.less` with the layered radial background, shared button resets, range input styling, and scrollbar styling.

- [ ] **Step 4: Build reusable content components**

Implement:

- `SectionHeader.vue` for titles + actions
- `AlbumCard.vue` for featured cards
- `TrackTable.vue` for the liked song list
- `MetricCard.vue` for profile metrics
- `RecentPlayList.vue` for compact recent queue items

Keep events explicit:

```ts
defineEmits<{
  play: [trackId: string];
  toggleLike: [trackId: string];
}>();
```

- [ ] **Step 5: Run the focused component test and global checks**

Run: `pnpm exec vitest run src/components/music/__tests__/TrackTable.test.ts`
Expected: PASS

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/styles/theme.less src/styles/index.less src/components/music src/components/music/__tests__/TrackTable.test.ts
git commit -m "feat: add liquid glass tokens and music components"
```

## Task 6: Implement Discover And Liked Pages Against The Real Store

**Files:**
- Modify: `src/views/DiscoverView.vue`
- Modify: `src/views/LikedView.vue`
- Modify: `src/data/music-library.ts`
- Modify: `src/stores/player.ts`
- Test: `src/views/__tests__/DiscoverView.test.ts`

- [ ] **Step 1: Write a failing discover page integration test**

Create `src/views/__tests__/DiscoverView.test.ts` to assert that clicking a discover recommendation calls the player store and updates the active track badge.

Example:

```ts
expect(wrapper.text()).toContain("最近播放");
await wrapper.get("[data-album-card]").trigger("click");
expect(player.currentTrack?.id).toBe("track-dawn");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/views/__tests__/DiscoverView.test.ts`
Expected: FAIL because views still contain placeholders

- [ ] **Step 3: Build the discover page**

`src/views/DiscoverView.vue` should include:

- hero welcome block
- featured album grid
- quick picks / atmosphere cards
- recent plays list tied to `recentPlayIds`

Wire card click behavior to store actions like `playFromQueue()` and `toggleLike()`.
Wire card click behavior to the store API defined in Task 3 only:

- `playContext(featuredTracks, trackId)`
- `playTrackById(trackId)`
- `toggleLike(trackId)`

- [ ] **Step 4: Build the liked page**

`src/views/LikedView.vue` should include:

- liked song count summary
- sortable-feeling track table layout
- active track highlighting
- per-row like toggle and play behavior

Use computed values from the store instead of duplicating liked state locally. Row actions should call:

- `playTrackById(trackId)`
- `toggleLike(trackId)`

- [ ] **Step 5: Run focused tests and broad validation**

Run: `pnpm exec vitest run src/components/music/__tests__/TrackTable.test.ts src/views/__tests__/DiscoverView.test.ts`
Expected: PASS

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/views/DiscoverView.vue src/views/LikedView.vue src/data/music-library.ts src/stores/player.ts src/views/__tests__/DiscoverView.test.ts
git commit -m "feat: implement discover and liked pages"
```

## Task 7: Implement The Profile Page With Lightweight Derived Analytics

**Files:**
- Modify: `src/views/ProfileView.vue`
- Modify: `src/data/profile.ts`
- Modify: `src/stores/player.ts`
- Test: `src/views/__tests__/ProfileView.test.ts`

- [ ] **Step 1: Write the failing profile analytics test**

Add a test asserting the profile view renders lightweight live metrics:

```ts
expect(wrapper.text()).toContain("收藏歌曲");
expect(wrapper.text()).toContain("最近播放");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/views/__tests__/ProfileView.test.ts`
Expected: FAIL because profile is still placeholder content

- [ ] **Step 3: Implement the profile page**

`src/views/ProfileView.vue` should compose:

- profile hero card with avatar
- metric cards for liked count, recent plays, active mode
- taste tags / favorite moods from track tags
- recent activity list sourced from session-only `recentPlayIds`

Keep analytics lightweight and session-scoped; do not add persistence.

- [ ] **Step 4: Run the profile-focused and full validation**

Run: `pnpm exec vitest run src/views/__tests__/ProfileView.test.ts`
Expected: PASS

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/views/ProfileView.vue src/data/profile.ts src/stores/player.ts src/views/__tests__/ProfileView.test.ts
git commit -m "feat: implement profile analytics page"
```

## Task 8: Build The Global Dock And Finish End-To-End Integration

**Files:**
- Modify: `src/components/AppShell.vue`
- Create: `src/components/dock/PlayerDock.vue`
- Create: `src/components/dock/PlaybackProgress.vue`
- Create: `src/components/dock/PlaybackControls.vue`
- Create: `src/components/dock/VolumeControl.vue`
- Modify: `src/components/dock/__tests__/PlayerDock.test.ts`
- Modify: `src/stores/player.ts`

- [ ] **Step 1: Write the failing dock behavior test**

Refine `src/components/dock/__tests__/PlayerDock.test.ts` into the final critical path test:

```ts
it("shows current track info and toggles playback from the dock", async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const player = usePlayerStore();
  await player.playTrackById("track-dawn");

  const wrapper = mount(PlayerDock, { global: { plugins: [pinia] } });
  expect(wrapper.text()).toContain("晨光之前");

  await wrapper.get("[data-action='toggle-play']").trigger("click");
  expect(player.isPlaying).toBe(false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/components/dock/__tests__/PlayerDock.test.ts`
Expected: FAIL because `PlayerDock.vue` does not exist or lacks controls

- [ ] **Step 3: Implement the dock and its subcomponents**

Design targets:

- white translucent bar
- subtle ambient glow layer behind the dock
- center play button with physical button feel instead of neon glow
- progress track with glass rail and blue gradient fill
- track art, title, artist, mode, volume, and error text
- 若存在 `errorTrackId` / `errorMessage`，显示轻量失败提示

Recommended structure:

```vue
<PlayerDock>
  <PlaybackProgress />
  <PlaybackControls />
  <VolumeControl />
</PlayerDock>
```

- [ ] **Step 4: Mount the dock globally**

Update `src/components/AppShell.vue` so the dock is rendered once beneath the main content area and survives route changes.

Dock wiring requirements:

- 播放/暂停按钮调用 `togglePlay()`
- 上一首/下一首按钮分别调用 `playPrevious()` / `playNext()`
- 进度条拖动调用 `seekTo()`
- 模式按钮调用 `cycleMode()`
- 音量滑块调用 `setVolume()`
- 静音按钮调用 `toggleMute()`

- [ ] **Step 5: Run the full test and delivery suite**

Run: `pnpm test`
Expected: PASS

Run: `pnpm lint`
Expected: PASS

Run: `pnpm typecheck`
Expected: PASS

Run: `pnpm build:web`
Expected: PASS with built assets including `/media/*.mp3`

Run: `pnpm build`
Expected: PASS with Tauri bundle produced successfully

- [ ] **Step 6: Commit**

```bash
git add src/components/AppShell.vue src/components/dock src/stores/player.ts
git commit -m "feat: add global liquid glass player dock"
```
