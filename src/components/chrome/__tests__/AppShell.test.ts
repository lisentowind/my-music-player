import { flushPromises, mount } from "@vue/test-utils";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "@/components/AppShell.vue";
import { configurePlayerAudioFactory, createHowlerPlayerAudio } from "@/lib/player/audio";
import { routes } from "@/router/routes";
import { useThemeStore } from "@/stores/theme";

vi.mock("howler", () => ({
  Howl: class {},
}));

vi.mock("gsap", () => ({
  gsap: {
    fromTo: (_target: unknown, _from: unknown, to: { onComplete?: () => void }) => {
      to.onComplete?.();
      return { kill: vi.fn() };
    },
    timeline: () => {
      const timeline = {
        to: (_target: unknown, to: { onComplete?: () => void }) => {
          to.onComplete?.();
          return timeline;
        },
        kill: vi.fn(),
      };

      return timeline;
    },
    to: (_target: unknown, to: { onComplete?: () => void }) => {
      to.onComplete?.();
      return { kill: vi.fn() };
    },
  },
}));

class FakePlayerAudio {
  src = "";
  currentTime = 0;
  duration = 0;
  volume = 1;
  muted = false;
  paused = true;
  error: { message?: string } | null = null;

  play = vi.fn(async () => {
    this.paused = false;
  });

  pause = vi.fn(() => {
    this.paused = true;
  });

  load = vi.fn(() => {});

  addEventListener = vi.fn(() => {});

  removeEventListener = vi.fn(() => {});
}

function expectLinkTarget(actualHref: string | undefined, expectedPath: string) {
  expect(actualHref).toBeTruthy();
  expect(actualHref === expectedPath || actualHref?.endsWith(expectedPath)).toBe(true);
}

function resolveFromTest(relativePath: string) {
  return fileURLToPath(new URL(relativePath, import.meta.url));
}

describe("app shell route skeleton", () => {
  const mountedWrappers: Array<{ unmount: () => void }> = [];

  async function mountShell(path = "/") {
    const pinia = createPinia();
    setActivePinia(pinia);

    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    await router.push(path);
    await router.isReady();

    const wrapper = mount(AppShell, {
      attachTo: document.body,
      global: {
        plugins: [router, pinia],
      },
    });

    mountedWrappers.push(wrapper);
    return { wrapper, router };
  }

  beforeEach(() => {
    configurePlayerAudioFactory(() => new FakePlayerAudio());
  });

  afterEach(() => {
    while (mountedWrappers.length > 0) {
      const wrapper = mountedWrappers.pop();
      wrapper?.unmount();
    }

    document.body.innerHTML = "";
  });

  afterAll(() => {
    configurePlayerAudioFactory(createHowlerPlayerAudio);
  });

  it("主导航只保留四条中文链接，播放器不再出现在左侧导航", async () => {
    const { wrapper } = await mountShell("/");

    const navLinks = wrapper.findAll(".nav-list .nav-link");
    expect(navLinks).toHaveLength(4);

    const findHrefByLabel = (label: string) => {
      const target = navLinks.find(link => link.text().includes(label));
      return target?.attributes("href");
    };

    expectLinkTarget(findHrefByLabel("首页"), "/");
    expectLinkTarget(findHrefByLabel("探索"), "/explore");
    expectLinkTarget(findHrefByLabel("歌单"), "/playlist");
    expectLinkTarget(findHrefByLabel("资料库"), "/library");
    expect(findHrefByLabel("播放器")).toBeUndefined();

    const navText = navLinks.map(link => link.text()).join(" ");
    expect(navText).not.toContain("Home");
    expect(navText).not.toContain("Explore");
    expect(navText).not.toContain("Playlist");
    expect(navText).not.toContain("Library");
    expect(navText).not.toContain("Player");
  });

  it("路由表使用中文 meta.title，并支持 /playlist 与 /playlist/:playlistId", () => {
    const routeByName = new Map(
      routes.map(route => [String(route.name), route]),
    );
    const routePaths = new Set(routes.map(route => route.path));

    expect(routeByName.get("home")?.meta?.title).toBe("首页");
    expect(routeByName.get("explore")?.meta?.title).toBe("探索");
    expect(routeByName.get("playlist")?.meta?.title).toBe("歌单");
    expect(routeByName.get("library")?.meta?.title).toBe("资料库");
    expect(routeByName.get("player")?.meta?.title).toBe("播放器");
    expect(routeByName.get("playlist-detail")?.meta?.title).toBe("歌单详情");

    expect(routePaths.has("/playlist")).toBe(true);
    expect(routePaths.has("/playlist/:playlistId")).toBe(true);
  });

  it("四个主导航页、全屏播放器与歌单详情深链都能命中对应页面节点", async () => {
    const { wrapper, router } = await mountShell("/");

    expect(wrapper.find("#home-page").exists()).toBe(true);

    await router.push("/explore");
    await flushPromises();
    expect(wrapper.find("#explore-page").exists()).toBe(true);

    await router.push("/playlist");
    await flushPromises();
    expect(wrapper.find("#playlist-page").exists()).toBe(true);

    await router.push("/playlist/lofi-night");
    await flushPromises();
    expect(wrapper.find("#playlist-page").exists()).toBe(true);

    await router.push("/library");
    await flushPromises();
    expect(wrapper.find("#library-page").exists()).toBe(true);

    await router.push("/player");
    await flushPromises();
    expect(wrapper.find("#player-page").exists()).toBe(true);
  });

  it("固定侧栏、固定顶栏与内容滚动区节点都存在", async () => {
    const { wrapper } = await mountShell("/");

    expect(wrapper.find('[data-testid="app-shell-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-shell-topbar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-shell-scroll"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="app-shell-topbar"]').attributes("data-topbar-anchor")).toBe("content-overlay");
    expect(wrapper.get('[data-testid="app-shell-scroll"]').attributes("data-scroll-style")).toBe("overlay-floating");
    expect(wrapper.get('[data-testid="app-shell-scroll"]').attributes("data-scroll-surface")).toBe("transparent");
    expect(wrapper.find('[data-testid="player-dock-shell"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-shell-theme-toggle"]').exists()).toBe(true);
  });

  it("右侧内容区、顶部栏与滚动画布都保留独立的窗口右边距", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/components/AppShell.vue", "utf-8");

    expect(source).toContain("right: var(--layout-gap);");
    expect(source).toContain("left: auto;");
    expect(source).toContain("top: 8px;");
    expect(source).toContain("width: max-content;");
    expect(source).toContain("padding: calc(var(--layout-topbar-height) + 16px) var(--layout-gap) calc(var(--layout-dock-space) + 12px);");
  });

  it("Explore 外的页面顶部展示进入探索按钮，点击后跳转到 Explore", async () => {
    const { wrapper, router } = await mountShell("/library");

    const button = wrapper.get('[data-testid="topbar-enter-explore"]');
    expect(button.text()).toContain("进入探索");

    await button.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/explore");
    const searchInput = wrapper.get('[data-testid="topbar-search-input"]');
    expect(document.activeElement).toBe(searchInput.element);
  });

  it("Explore 页显示搜索输入框，其他页面不直接显示搜索框", async () => {
    const { wrapper, router } = await mountShell("/explore");

    expect(wrapper.find('[data-testid="topbar-search-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="topbar-enter-explore"]').exists()).toBe(false);

    await router.push("/playlist");
    await flushPromises();

    expect(wrapper.find('[data-testid="topbar-search-input"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="topbar-enter-explore"]').exists()).toBe(true);
  });

  it("Explore 页源码里的顶部搜索框已切到共享 UiSearchField 组件", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/components/chrome/AppTopbar.vue", "utf-8");

    expect(source).toContain('import UiSearchField from "@/components/ui/UiSearchField.vue"');
    expect(source).toContain("<UiSearchField");
    expect(source).not.toContain('class="app-topbar__search-input"');
  });

  it("顶部图标按钮默认保持图标居中，悬停后再展开标签", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/components/chrome/AppTopbar.vue", "utf-8");

    expect(source).toContain("justify-content: center;");
    expect(source).toContain("justify-content: flex-start;");
  });

  it("顶部不再额外显示当前页面名称胶囊", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/components/chrome/AppTopbar.vue", "utf-8");

    expect(source).not.toContain("app-topbar__page");
    expect(source).not.toContain("page-label");
  });

  it("主滚动区在路由切换后会自动回到顶部，避免沿用上一页滚动位置", async () => {
    const { wrapper, router } = await mountShell("/");
    const scrollElement = wrapper.get('[data-testid="app-shell-scroll"]').element as HTMLElement;

    scrollElement.scrollTop = 240;

    await router.push("/explore");
    await flushPromises();

    expect(scrollElement.scrollTop).toBe(0);
  });

  it("页面切走再回来时会保留缓存页面的本地内容状态", async () => {
    const { wrapper, router } = await mountShell("/explore");
    const exploreSearch = wrapper.get('#explore-page [data-testid="explore-search-input"]');

    await exploreSearch.setValue("漂移中的搜索词");
    expect((exploreSearch.element as HTMLInputElement).value).toBe("漂移中的搜索词");

    await router.push("/library");
    await flushPromises();
    await router.push("/explore");
    await flushPromises();

    const restoredSearch = wrapper.get('#explore-page [data-testid="explore-search-input"]');
    expect((restoredSearch.element as HTMLInputElement).value).toBe("漂移中的搜索词");
  });

  it("Player 页切成全屏沉浸模式，侧栏顶栏和全局 Dock 都会隐藏", async () => {
    const { wrapper } = await mountShell("/player");

    expect(wrapper.find("#player-page").exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-shell-sidebar"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="app-shell-topbar"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="player-dock-shell"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="app-shell-layout"]').attributes("data-shell-mode")).toBe("player-fullscreen");
  });

  it("顶部改为单独设置按钮，并移除状态块、个人资料块和侧栏底部在线卡片", async () => {
    const { wrapper } = await mountShell("/");

    expect(wrapper.find('[data-testid="topbar-status-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="topbar-profile-button"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="topbar-settings-button"]').attributes("aria-label")).toContain("设置");
    expect(wrapper.text()).not.toContain("应用状态");
    expect(wrapper.text()).not.toContain("在线就绪");
    expect(wrapper.text()).not.toContain("个人资料");
    expect(wrapper.text()).not.toContain("在线资源已连接");
    expect(wrapper.text()).not.toContain("在线曲库");
    expect(wrapper.text()).not.toContain("深夜聆听");
    expect(wrapper.text()).not.toContain("精选收藏");
  });

  it("点击顶部设置按钮会打开设置弹窗，可切换主题模式和主题色", async () => {
    const { wrapper } = await mountShell("/");

    expect(wrapper.find('[data-testid="settings-dialog"]').exists()).toBe(false);

    await wrapper.get('[data-testid="topbar-settings-button"]').trigger("click");
    await flushPromises();

    expect(wrapper.get('[data-testid="settings-dialog"]').attributes("open")).toBeDefined();
    expect(wrapper.text()).toContain("外观设置");
    expect(wrapper.text()).not.toContain("界面预览");
    expect(wrapper.text()).not.toContain("胶囊 Dock");
    expect(wrapper.get("[data-testid='theme-preset-frost']").attributes("title")).toContain("霜蓝");
  });

  it("亮暗与跟随系统切换会常驻显示在壳层右上角，而不是重复放进设置弹窗", async () => {
    const { wrapper } = await mountShell("/");
    const theme = useThemeStore();
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/components/chrome/AppSettingsDialog.vue", "utf-8");

    expect(wrapper.get('[data-testid="app-shell-theme-toggle"]').find("[data-testid='theme-mode-light']").exists()).toBe(true);
    expect(wrapper.get('[data-testid="app-shell-theme-toggle"]').find("[data-testid='theme-mode-dark']").exists()).toBe(true);
    expect(wrapper.get('[data-testid="app-shell-theme-toggle"]').find("[data-testid='theme-mode-system']").exists()).toBe(true);

    await wrapper.get('[data-testid="app-shell-theme-toggle"]').find("[data-testid='theme-mode-dark']").trigger("click");
    await flushPromises();
    expect(theme.mode).toBe("dark");

    expect(source).not.toContain('import UiThemeToggle from "@/components/ui/UiThemeToggle.vue"');
    expect(source).not.toContain("<UiThemeToggle");
  });

  it("设置弹窗不再模糊背景页面，并移除界面预览占位区", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/components/chrome/AppSettingsDialog.vue", "utf-8");

    expect(source).not.toContain("backdrop-filter: blur(16px);");
    expect(source).not.toContain("界面预览");
    expect(source).not.toContain("胶囊 Dock · 玻璃面板 · 中文排版");
  });

  it("全屏播放器壳层会隐藏内部滚动条，并避免播放器页面出现独立滚动条", () => {
    const source = readFileSync("/Users/tingfeng/Documents/code/github/my-player/src/components/AppShell.vue", "utf-8");

    expect(source).toContain("scrollbar-width: none;");
    expect(source).toContain("::-webkit-scrollbar");
    expect(source).not.toContain("<KeepAlive");
    expect(source).not.toContain(':key="currentRoute.fullPath"');
  });

  it("主题切换与主题色面板入口已从壳层移除", async () => {
    const { wrapper } = await mountShell("/");

    expect(wrapper.find('[data-testid="sidebar-theme-controls"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="topbar-theme-controls"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain("外观控制台");
  });

  it("根布局内容容器固定统一的最小宽高，并保留横向滚动保护", async () => {
    const { wrapper } = await mountShell("/");

    const layout = wrapper.get('[data-testid="app-shell-layout"]');
    const scroll = wrapper.get('[data-testid="app-shell-scroll"]');

    expect(layout.attributes("data-min-width")).toBe("1220");
    expect(layout.attributes("data-min-height")).toBe("760");
    expect(scroll.attributes("data-overflow-x")).toBe("auto");
  });

  it("Tauri 窗口最小尺寸与前端壳层最小尺寸保持一致", () => {
    const tauriConfigPath = resolveFromTest("../../../../src-tauri/tauri.conf.json");
    const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, "utf-8")) as {
      app?: {
        windows?: Array<{
          minWidth?: number;
          minHeight?: number;
        }>;
      };
    };

    const mainWindow = tauriConfig.app?.windows?.[0];
    expect(mainWindow?.minWidth).toBe(1220);
    expect(mainWindow?.minHeight).toBe(760);
  });

  it("窄宽度保护下 Dock 仍保持完整结构", async () => {
    const { wrapper } = await mountShell("/");

    const dock = wrapper.get('[data-testid="player-dock-shell"]');
    expect(dock.find('[data-testid="player-dock-transport"]').exists()).toBe(true);
    expect(dock.find('[data-testid="player-dock-progress"]').exists()).toBe(true);
  });

  it("壳层视觉切换到 Stitch 风格：深色侧栏、创建歌单 CTA 与胶囊播放器栏", async () => {
    const { wrapper } = await mountShell("/");

    expect(wrapper.get('[data-testid="app-shell-layout"]').attributes("data-shell-visual")).toBe("stitch");
    expect(wrapper.get('[data-testid="app-shell-sidebar"]').attributes("data-sidebar-visual")).toBe("editorial");
    expect(wrapper.get('[data-testid="app-shell-topbar"]').attributes("data-topbar-visual")).toBe("floating");

    const sidebarText = wrapper.get('[data-testid="app-shell-sidebar"]').text();
    expect(sidebarText).toContain("创建歌单");

    const dock = wrapper.get('[data-testid="player-dock-shell"]');
    expect(dock.attributes("data-dock-style")).toBe("capsule");
    expect(dock.attributes("data-dock-glass")).toBe("heavy");
  });

  it("代码库中不再保留旧页面与旧测试文件", () => {
    const legacyFiles = [
      "../../../views/DiscoverView.vue",
      "../../../views/LikedView.vue",
      "../../../views/ProfileView.vue",
      "../../../views/__tests__/DiscoverView.test.ts",
      "../../../views/__tests__/LikedView.test.ts",
      "../../../views/__tests__/ProfileView.test.ts",
    ];

    for (const relativePath of legacyFiles) {
      expect(existsSync(resolveFromTest(relativePath))).toBe(false);
    }
  });

  it("主壳层路由切换后不再出现旧页面根节点标识", async () => {
    const { wrapper, router } = await mountShell("/");

    const legacyPageIds = ["#discover-page", "#liked-page", "#profile-page"];

    for (const path of ["/", "/explore", "/playlist", "/playlist/lofi-night", "/library", "/player"]) {
      await router.push(path);
      await flushPromises();

      for (const legacyId of legacyPageIds) {
        expect(wrapper.find(legacyId).exists()).toBe(false);
      }
    }
  });

  it("当前五个页面的可见文案不再出现残留英文界面词", async () => {
    const { wrapper, router } = await mountShell("/");

    for (const path of ["/", "/explore", "/playlist", "/playlist/lofi-night", "/library", "/player"]) {
      await router.push(path);
      await flushPromises();

      const pageText = wrapper.text();
      expect(pageText).not.toContain("Dock");
      expect(pageText).not.toContain("ms");
    }
  });
});
