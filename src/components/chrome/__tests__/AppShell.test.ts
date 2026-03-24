import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { describe, expect, it } from "vitest";
import AppShell from "@/components/AppShell.vue";
import { routes } from "@/router/routes";

function expectLinkTarget(actualHref: string | undefined, expectedPath: string) {
  expect(actualHref).toBeTruthy();
  expect(actualHref === expectedPath || actualHref?.endsWith(expectedPath)).toBe(true);
}

describe("app shell chrome", () => {
  it("主导航包含三条链接且目标地址正确", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(AppShell, {
      global: {
        plugins: [router],
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
        plugins: [router],
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
});
