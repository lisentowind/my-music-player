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

  it("切到 Player 页后侧栏、顶栏和 Dock 仍然存在，且顶栏占位对读屏隐藏", async () => {
    const { wrapper } = await mountShell("/player");

    expect(wrapper.find("#player-page").exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-shell-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="player-dock-shell"]').exists()).toBe(true);
    const topbar = wrapper.find('[data-testid="app-shell-topbar"]');
    expect(topbar.exists()).toBe(true);
    expect(topbar.attributes("aria-hidden")).toBe("true");
  });
});
