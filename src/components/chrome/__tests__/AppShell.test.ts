import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { describe, expect, it } from "vitest";
import AppShell from "@/components/AppShell.vue";
import { routes } from "@/router/routes";

describe("app shell", () => {
  it("显示音乐应用主导航入口", async () => {
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

    const text = wrapper.text();
    expect(text).toContain("推荐");
    expect(text).toContain("我喜欢");
    expect(text).toContain("个人中心");
    expect(text).not.toContain("Home");
    expect(text).not.toContain("About");
  });

  it("使用 discover/liked/profile 三页路由信息架构", () => {
    const routeSignatures = routes.map(route => ({
      path: route.path,
      name: route.name,
    }));

    expect(routeSignatures).toEqual([
      { path: "/", name: "discover" },
      { path: "/liked", name: "liked" },
      { path: "/profile", name: "profile" },
    ]);
  });
});
