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
  { name: "home", icon: iconRegistry["solar:music-notes-outline"] },
  { name: "explore", icon: iconRegistry["solar:sun-outline"] },
  { name: "playlist", icon: iconRegistry["solar:heart-outline"] },
  { name: "library", icon: iconRegistry["solar:user-outline"] },
] as const;

const quickTags = [
  { key: "wave", label: "在线曲库", icon: iconRegistry["solar:music-notes-outline"] },
  { key: "night", label: "深夜聆听", icon: iconRegistry["solar:moon-outline"] },
  { key: "picked", label: "精选收藏", icon: iconRegistry["solar:heart-outline"] },
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
      icon: spec.icon,
    };
  }).filter(item => item.label);
});

useGsapReveal(sidebarRef, [".brand", ".app-sidebar__tag", ".nav-link", ".app-sidebar__cta"], 0.08);
useGsapHoverTargets(sidebarRef, [".app-sidebar__tag", ".nav-link", ".app-sidebar__cta"], {
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
          <strong class="brand__title">回声星港</strong>
          <p class="brand__eyebrow">高保真桌面声场</p>
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
              </span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <button type="button" class="app-sidebar__cta">
        <Icon :icon="iconRegistry['solar:music-notes-outline']" />
        <span>创建歌单</span>
      </button>
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
  gap: 14px;
  height: 100%;
  padding: 18px 16px;
  overflow: hidden;
  border-radius: 0 32px 32px 0;
  border-right-color: color-mix(in srgb, var(--color-panel-border) 86%, transparent);
  background:
    radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 32%),
    linear-gradient(180deg, var(--color-panel-glow-start), transparent 18%),
    var(--color-panel-fill);
  box-shadow:
    var(--shadow-md),
    inset 0 1px 0 var(--color-panel-glow-end);
}

.brand__badge {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--gradient-primary);
  color: var(--color-on-accent);
  box-shadow: var(--shadow-primary-hover);
}

.brand__badge :deep(svg) {
  width: 18px;
  height: 18px;
}

.brand__copy {
  min-width: 0;
}

.brand__title {
  display: block;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
}

.brand__eyebrow {
  display: inline-flex;
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.app-sidebar__tag {
  min-height: 30px;
  padding: 0 9px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 80%, transparent), transparent 100%),
    var(--color-control-surface);
  color: var(--color-text-secondary);
  font-size: 10px;
  box-shadow: inset 0 1px 0 var(--color-panel-glow-end);
}

.app-sidebar__tag :deep(svg) {
  width: 14px;
  height: 14px;
}

.app-sidebar__nav {
  min-height: 0;
}

.nav-list {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.nav-link {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: transparent;
  color: var(--color-text-secondary);
  transition:
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.nav-link:hover {
  border-color: var(--color-border);
  background: var(--color-control-surface-strong);
  color: var(--color-text-strong);
}

.nav-link.is-active {
  border-color: color-mix(in srgb, var(--color-accent) 28%, var(--color-border));
  background: color-mix(in srgb, var(--color-accent) 16%, var(--color-control-surface-strong));
  color: var(--color-text-strong);
  box-shadow: inset 0 1px 0 var(--color-panel-glow-end);
}

.nav-link__icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 84%, transparent), transparent 100%),
    var(--color-control-surface);
  box-shadow: inset 0 1px 0 var(--color-panel-glow-end);
}

.nav-link__icon :deep(svg) {
  width: 17px;
  height: 17px;
}

.nav-link.is-active .nav-link__icon {
  background: var(--gradient-primary);
  color: var(--color-on-accent);
}

.nav-link__label {
  display: block;
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: 12px;
  font-weight: 700;
}

.app-sidebar__cta {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 16px;
  background: var(--gradient-primary);
  color: var(--color-on-accent);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow-primary-hover);
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.app-sidebar__cta:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-primary-active);
}
</style>
