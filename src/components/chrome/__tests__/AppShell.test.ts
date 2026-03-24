import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "@/components/AppShell.vue";
import { routes } from "@/router/routes";

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

    const navLinks = wrapper.findAll("nav[aria-label='主导航'] .nav-link");
    expect(navLinks).toHaveLength(3);

    const hrefByText = new Map(
      navLinks.map(link => [link.text(), link.attributes("href")]),
    );

    expectLinkTarget(hrefByText.get("推荐"), "/");
    expectLinkTarget(hrefByText.get("我喜欢"), "/liked");
    expectLinkTarget(hrefByText.get("个人中心"), "/profile");
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

  it("切换路由后 topbar 标题与页面骨架同步更新，且壳层只有一个 main", async () => {
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

    expect(wrapper.find(".meta__title").text()).toBe("推荐");
    expect(wrapper.find("#discover-page").exists()).toBe(true);
    expect(wrapper.findAll("main")).toHaveLength(1);

    await router.push("/liked");
    await flushPromises();
    expect(wrapper.find(".meta__title").text()).toBe("我喜欢");
    expect(wrapper.find("#liked-page").exists()).toBe(true);

    await router.push("/profile");
    await flushPromises();
    expect(wrapper.find(".meta__title").text()).toBe("个人中心");
    expect(wrapper.find("#profile-page").exists()).toBe(true);
  });

  it("renders the fixed shell regions for sidebar and scrollable content", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
    const pinia = createPinia();
    await router.push("/");
    await router.isReady();

    const wrapper = mount(AppShell, {
      global: {
        plugins: [router, pinia],
      },
    });

    expect(wrapper.find("[data-testid='app-shell-root']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='app-shell-sidebar']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='app-shell-scroll']").exists()).toBe(true);
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
