import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "@/components/AppShell.vue";
import { configurePlayerAudioFactory, createHowlerPlayerAudio } from "@/lib/player/audio";
import { routes } from "@/router/routes";

vi.mock("howler", () => ({
  Howl: class {},
}));

vi.mock("gsap", () => ({
  gsap: {
    fromTo: (_target: unknown, _from: unknown, to: { onComplete?: () => void }) => {
      to.onComplete?.();
      return { kill: vi.fn() };
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

  it("主导航包含五条中文链接，且目标地址正确", async () => {
    const { wrapper } = await mountShell("/");

    const navLinks = wrapper.findAll(".nav-list .nav-link");
    expect(navLinks).toHaveLength(5);

    const findHrefByLabel = (label: string) => {
      const target = navLinks.find(link => link.text().includes(label));
      return target?.attributes("href");
    };

    expectLinkTarget(findHrefByLabel("首页"), "/");
    expectLinkTarget(findHrefByLabel("探索"), "/explore");
    expectLinkTarget(findHrefByLabel("歌单"), "/playlist");
    expectLinkTarget(findHrefByLabel("资料库"), "/library");
    expectLinkTarget(findHrefByLabel("播放器"), "/player");

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

  it("五个主页面与歌单详情深链都能命中对应页面占位节点", async () => {
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
    expect(wrapper.find('[data-testid="player-dock-shell"]').exists()).toBe(true);
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

  it("Player 页仍保留壳层，但会挂上独立视觉区域标记", async () => {
    const { wrapper } = await mountShell("/player");

    expect(wrapper.find("#player-page").exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-shell-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-shell-topbar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="player-dock-shell"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="app-shell-layout"]').attributes("data-shell-mode")).toBe("player");
  });

  it("顶部状态按钮与头像区域都有中文辅助文案或 aria 标签", async () => {
    const { wrapper } = await mountShell("/");

    expect(wrapper.get('[data-testid="topbar-status-button"]').attributes("aria-label")).toContain("应用状态");
    expect(wrapper.get('[data-testid="topbar-profile-button"]').attributes("aria-label")).toContain("个人资料");
  });

  it("主题切换与主题色面板入口已从壳层移除", async () => {
    const { wrapper } = await mountShell("/");

    expect(wrapper.find('[data-testid="sidebar-theme-controls"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="topbar-theme-controls"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain("外观控制台");
  });

  it("根布局内容容器固定最小宽度为 1280px，并保留横向滚动保护", async () => {
    const { wrapper } = await mountShell("/");

    const layout = wrapper.get('[data-testid="app-shell-layout"]');
    const scroll = wrapper.get('[data-testid="app-shell-scroll"]');

    expect(layout.attributes("data-min-width")).toBe("1280");
    expect(scroll.attributes("data-overflow-x")).toBe("auto");
  });

  it("窄宽度保护下 Dock 仍保持完整结构", async () => {
    const { wrapper } = await mountShell("/");

    const dock = wrapper.get('[data-testid="player-dock-shell"]');
    expect(dock.find('[data-testid="player-dock-transport"]').exists()).toBe(true);
    expect(dock.find('[data-testid="player-dock-progress"]').exists()).toBe(true);
  });
});
