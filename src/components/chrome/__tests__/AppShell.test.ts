import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "@/components/AppShell.vue";
import { routes } from "@/router/routes";

vi.mock("howler", () => ({
  Howl: class {},
}));

vi.mock("gsap", () => ({
  gsap: {
    fromTo: (_target: unknown, _from: unknown, to: { onComplete?: () => void, clearProps?: string }) => {
      to.onComplete?.();
      return { kill: vi.fn() };
    },
    to: (_target: unknown, to: { onComplete?: () => void, clearProps?: string }) => {
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

describe("app shell chrome", () => {
  beforeEach(async () => {
    vi.resetModules();
    setActivePinia(createPinia());

    const fakeAudio = new FakePlayerAudio();
    const { configurePlayerAudioFactory } = await import("@/lib/player/audio");
    configurePlayerAudioFactory(() => fakeAudio);
  });

  it("主导航包含三条链接且目标地址正确", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(AppShell, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    const navLinks = wrapper.findAll(".nav-list .nav-link");
    expect(navLinks).toHaveLength(3);

    const findHrefByLabel = (label: string) => {
      const target = navLinks.find(link => link.text().includes(label));
      return target?.attributes("href");
    };

    expectLinkTarget(findHrefByLabel("推荐"), "/");
    expectLinkTarget(findHrefByLabel("我喜欢"), "/liked");
    expectLinkTarget(findHrefByLabel("个人中心"), "/profile");
  });

  it("使用 route meta.title 作为标题信息源", () => {
    const routeByName = new Map(
      routes.map(route => [String(route.name), route]),
    );

    expect(routeByName.size).toBe(3);
    expect(routeByName.get("discover")?.path).toBe("/");
    expect(routeByName.get("discover")?.meta?.title).toBe("推荐");
    expect(routeByName.get("liked")?.path).toBe("/liked");
    expect(routeByName.get("liked")?.meta?.title).toBe("我喜欢");
    expect(routeByName.get("profile")?.path).toBe("/profile");
    expect(routeByName.get("profile")?.meta?.title).toBe("个人中心");
  });

  it("切换路由后页面骨架同步更新，且壳层只有一个 main", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(AppShell, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    expect(wrapper.find("#discover-page").exists()).toBe(true);
    expect(wrapper.findAll("main")).toHaveLength(1);
    expect(wrapper.find('[data-testid="app-shell-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="app-shell-topbar"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="app-shell-scroll"]').exists()).toBe(true);

    await router.push("/liked");
    await flushPromises();
    expect(wrapper.find("#liked-page").exists()).toBe(true);

    await router.push("/profile");
    await flushPromises();
    expect(wrapper.find("#profile-page").exists()).toBe(true);
  });

  it("sidebar 右下角提供主题模式、预设色和自定义颜色控件", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(AppShell, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    expect(wrapper.find("[data-testid='sidebar-theme-controls']").exists()).toBe(false);

    await wrapper.get("[data-testid='sidebar-menu-trigger']").trigger("click");
    await flushPromises();

    expect(wrapper.find("[data-testid='sidebar-theme-controls']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='sidebar-theme-toggle']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='theme-mode-light']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='theme-mode-dark']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='theme-mode-system']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='theme-custom-color']").exists()).toBe(true);

    await wrapper.get("[data-testid='theme-mode-dark']").trigger("click");
    await flushPromises();
    expect(document.documentElement.getAttribute("data-theme-resolved")).toBe("dark");
  });

  it("左侧外观弹层会限制在 sidebar 可用高度内并内部滚动", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(AppShell, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    const sidebar = wrapper.get("[data-testid='app-shell-sidebar']").element as HTMLElement;
    const sidebarRect = {
      x: 0,
      y: 16,
      top: 16,
      left: 0,
      right: 288,
      bottom: 916,
      width: 288,
      height: 900,
      toJSON: () => ({}),
    };
    sidebar.getBoundingClientRect = vi.fn(() => sidebarRect);

    const trigger = wrapper.get(".app-sidebar__menu-trigger").element as HTMLElement;
    trigger.getBoundingClientRect = vi.fn(() => ({
      x: 232,
      y: 760,
      top: 760,
      left: 232,
      right: 272,
      bottom: 800,
      width: 40,
      height: 40,
      toJSON: () => ({}),
    }));

    await wrapper.get("[data-testid='sidebar-menu-trigger']").trigger("click");
    await flushPromises();

    const popover = wrapper.get("[data-testid='sidebar-theme-controls']");
    expect(popover.attributes("data-placement")).toBe("right");
    expect(popover.attributes("style")).toContain("max-height:");
    expect(popover.attributes("style")).toContain("overflow-y:");
    expect(popover.attributes("style")).toContain("width:");
  });

  it("左侧外观弹层在窗口高度变化后会重新计算可用高度", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(AppShell, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    const sidebar = wrapper.get("[data-testid='app-shell-sidebar']").element as HTMLElement;
    const sidebarRect = {
      x: 0,
      y: 16,
      top: 16,
      left: 0,
      right: 288,
      bottom: 916,
      width: 288,
      height: 900,
      toJSON: () => ({}),
    };
    sidebar.getBoundingClientRect = vi.fn(() => sidebarRect);

    const trigger = wrapper.get(".app-sidebar__menu-trigger").element as HTMLElement;
    const triggerRect = {
      x: 232,
      y: 760,
      top: 760,
      left: 232,
      right: 272,
      bottom: 800,
      width: 40,
      height: 40,
      toJSON: () => ({}),
    };
    trigger.getBoundingClientRect = vi.fn(() => triggerRect);

    await wrapper.get("[data-testid='sidebar-menu-trigger']").trigger("click");
    await flushPromises();

    const popover = wrapper.get("[data-testid='sidebar-theme-controls']");
    expect(popover.attributes("data-placement")).toBe("right");

    sidebarRect.bottom = 736;
    sidebarRect.height = 720;
    window.dispatchEvent(new Event("resize"));
    await flushPromises();

    expect(popover.attributes("data-placement")).toBe("right");
    expect(popover.attributes("style")).toContain("max-height:");
  });

  it("响应式布局下菜单按钮弹层会改为向下展开", async () => {
    const previousWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 800,
    });

    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(AppShell, {
      global: {
        plugins: [router, createPinia()],
      },
    });

    window.dispatchEvent(new Event("resize"));
    await flushPromises();

    await wrapper.get("[data-testid='sidebar-menu-trigger']").trigger("click");
    await flushPromises();

    const popover = wrapper.get("[data-testid='sidebar-theme-controls']");
    expect(popover.attributes("data-placement")).toBe("bottom");
    expect(popover.attributes("style") ?? "").not.toContain("width:");

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: previousWidth,
    });
  });

  it("discover 喜欢与播放能联动到 liked，并把最近播放回写到 discover", async () => {
    const pinia = createPinia();
    const { usePlayerStore } = await import("@/stores/player");
    const player = usePlayerStore(pinia);
    const likedCountBefore = player.likedCount;
    const targetTrackId = "track-glacier-pulse";
    const targetTrackTitle = "冰川脉冲";

    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(AppShell, {
      global: {
        plugins: [router, pinia],
      },
    });

    const targetQuickCard = wrapper.findAll(".discover-view__quick-card")
      .find(card => card.text().includes(targetTrackTitle));
    expect(targetQuickCard).toBeTruthy();
    await targetQuickCard!.get(".discover-view__quick-like").trigger("click");
    await flushPromises();

    await router.push("/liked");
    await flushPromises();

    expect(wrapper.text()).toContain(`${likedCountBefore + 1} 首`);
    expect(wrapper.find(`[data-testid='track-row-${targetTrackId}']`).exists()).toBe(true);

    await wrapper.get(`[data-testid='track-play-${targetTrackId}']`).trigger("click");
    await flushPromises();

    expect(wrapper.get(`[data-testid='track-row-${targetTrackId}']`).attributes("data-active")).toBe("true");

    await router.push("/");
    await flushPromises();

    const recentActiveTitle = wrapper.get(
      "#discover-recent-plays .recent-play-list__item[data-active='true'] .recent-play-list__title",
    );
    expect(recentActiveTitle.text()).toContain(targetTrackTitle);
  });
});
