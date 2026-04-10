<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import GlassPanel from "@/components/chrome/GlassPanel.vue";
import { useGsapHoverTargets, useGsapReveal } from "@/composables/use-gsap";
import { iconRegistry } from "@/components/ui/icon-registry";
import { routes } from "@/router/routes";

const sidebarRef = ref<HTMLElement | null>(null);

const sidebarSpecs = [
  {
    name: "home",
    hint: "今日精选",
    icon: iconRegistry["solar:music-notes-outline"],
  },
  {
    name: "explore",
    hint: "快速发现",
    icon: iconRegistry["solar:sun-outline"],
  },
  {
    name: "playlist",
    hint: "故事编排",
    icon: iconRegistry["solar:heart-outline"],
  },
  {
    name: "library",
    hint: "收藏资产",
    icon: iconRegistry["solar:user-outline"],
  },
  {
    name: "player",
    hint: "沉浸空间",
    icon: iconRegistry["solar:play-bold"],
  },
] as const;

const quickTags = [
  {
    key: "wave",
    label: "在线曲库",
    icon: iconRegistry["solar:music-notes-outline"],
  },
  {
    key: "signal",
    label: "动态探索",
    icon: iconRegistry["solar:monitor-outline"],
  },
  {
    key: "me",
    label: "我的资料",
    icon: iconRegistry["solar:user-outline"],
  },
] as const;

const navItems = computed(() => {
  const routeMap = new Map(
    routes
      .filter(route => route.name)
      .map(route => [String(route.name), route]),
  );

  return sidebarSpecs.map((spec) => {
    const route = routeMap.get(spec.name);

    return {
      key: spec.name,
      to: route?.name ? { name: route.name } : { path: "/" },
      label: typeof route?.meta?.title === "string" ? route.meta.title : "",
      hint: spec.hint,
      icon: spec.icon,
    };
  });
});

useGsapReveal(sidebarRef, [".brand", ".app-sidebar__tag", ".nav-link", ".app-sidebar__footer"], 0.08);
useGsapHoverTargets(sidebarRef, [".app-sidebar__tag", ".nav-link"], {
  hoverY: -2,
  hoverScale: 1.01,
});
</script>

<template>
  <aside ref="sidebarRef" class="app-sidebar">
    <GlassPanel class="app-sidebar__panel">
      <div class="brand flex items-center gap-4">
        <div class="brand__badge" aria-hidden="true">
          <Icon :icon="iconRegistry['solar:music-notes-outline']" />
        </div>
        <div class="brand__copy">
          <span class="brand__eyebrow">回声星港</span>
          <strong class="brand__title">桌面聆听站</strong>
          <p class="brand__subtitle">五个主页面共用一套深色控制壳层与统一底部播放器栏。</p>
        </div>
      </div>

      <div class="app-sidebar__tags flex flex-wrap gap-2" aria-label="内容速览">
        <span
          v-for="tag in quickTags"
          :key="tag.key"
          class="app-sidebar__tag inline-flex items-center gap-2"
        >
          <Icon :icon="tag.icon" />
          <span>{{ tag.label }}</span>
        </span>
      </div>

      <nav class="app-sidebar__nav" aria-label="主导航">
        <ul class="nav-list">
          <li v-for="item in navItems" :key="item.key">
            <RouterLink :to="item.to" class="nav-link" exact-active-class="is-active">
              <span class="nav-link__icon" aria-hidden="true">
                <Icon :icon="item.icon" />
              </span>
              <span class="nav-link__copy">
                <span class="nav-link__label">{{ item.label }}</span>
                <span class="nav-link__hint">{{ item.hint }}</span>
              </span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="app-sidebar__footer">
        <p class="app-sidebar__footer-label">当前状态</p>
        <div class="app-sidebar__footer-card">
          <span class="app-sidebar__footer-dot" aria-hidden="true" />
          <div>
            <strong>在线资源已连接</strong>
            <p>封面、音频与歌词将在新页面中继续共用同一套数据层。</p>
          </div>
        </div>
      </div>
    </GlassPanel>
  </aside>
</template>

<style scoped lang="less">
.app-sidebar {
  height: 100%;
}

.app-sidebar__panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: var(--space-5);
  height: 100%;
  padding: 24px;
  overflow: hidden;
}

.brand__badge {
  width: 54px;
  height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--color-accent) 28%, transparent);
  border-radius: 18px;
  background: var(--gradient-primary);
  color: var(--color-text-contrast);
  box-shadow: var(--shadow-primary-hover);
}

.brand__badge :deep(svg) {
  width: 24px;
  height: 24px;
}

.brand__copy {
  min-width: 0;
}

.brand__eyebrow {
  display: inline-flex;
  margin-bottom: 6px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.brand__title {
  display: block;
  color: var(--color-text-strong);
  font-size: 24px;
  line-height: 1.1;
}

.brand__subtitle {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.app-sidebar__tags {
  align-items: flex-start;
}

.app-sidebar__tag {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-control-surface) 90%, transparent);
  color: var(--color-text-secondary);
  font-size: 12px;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease;
}

.app-sidebar__tag :deep(svg) {
  width: 15px;
  height: 15px;
}

.app-sidebar__tag:hover {
  border-color: var(--color-state-border-emphasis);
  color: var(--color-text);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}

.app-sidebar__nav {
  min-height: 0;
}

.nav-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.nav-link {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid transparent;
  border-radius: 22px;
  background: transparent;
  color: var(--color-text-secondary);
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease;
}

.nav-link:hover {
  border-color: var(--color-state-border-subtle);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent);
  color: var(--color-text);
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.16);
}

.nav-link.is-active {
  border-color: color-mix(in srgb, var(--color-accent) 38%, transparent);
  background:
    radial-gradient(circle at right top, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 42%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent);
  color: var(--color-text-strong);
  box-shadow: 0 20px 32px rgba(0, 0, 0, 0.2);
}

.nav-link__icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 16px;
  background: color-mix(in srgb, var(--color-control-surface) 88%, transparent);
}

.nav-link__icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.nav-link.is-active .nav-link__icon {
  border-color: color-mix(in srgb, var(--color-accent) 34%, transparent);
  background: var(--gradient-primary);
  color: var(--color-text-contrast);
}

.nav-link__copy {
  min-width: 0;
}

.nav-link__label {
  display: block;
  font-size: 15px;
  font-weight: 600;
}

.nav-link__hint {
  display: block;
  margin-top: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.app-sidebar__footer {
  display: grid;
  gap: 10px;
}

.app-sidebar__footer-label {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.app-sidebar__footer-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent);
}

.app-sidebar__footer-card strong {
  display: block;
  color: var(--color-text);
  font-size: 13px;
}

.app-sidebar__footer-card p {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.app-sidebar__footer-dot {
  width: 10px;
  height: 10px;
  margin-top: 4px;
  border-radius: 999px;
  background: linear-gradient(135deg, #63f0be, #2bc896);
  box-shadow: 0 0 0 6px rgba(67, 201, 147, 0.14);
}
</style>
