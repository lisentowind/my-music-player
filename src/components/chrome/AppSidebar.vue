<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import GlassPanel from "@/components/chrome/GlassPanel.vue";
import { routes } from "@/router/routes";

const navItems = computed(() => {
  return routes
    .filter(route => route.meta?.showInSidebar)
    .map((route) => {
      const label = typeof route.meta?.title === "string" ? route.meta.title : "";
      return {
        to: String(route.path),
        label,
        icon: typeof route.meta?.icon === "string" ? route.meta.icon : "solar:music-notes-linear",
      };
    });
});
</script>

<template>
  <aside class="app-sidebar">
    <GlassPanel class="app-sidebar__panel" tag="nav" aria-label="主导航">
      <div class="brand">
        <span class="brand__logo">MP</span>
        <div class="brand__copy">
          <strong class="brand__title">My Player</strong>
          <span class="brand__subtitle">Liquid Glass Music</span>
        </div>
      </div>

      <div class="app-sidebar__nav-wrap">
        <ul class="nav-list">
          <li v-for="item in navItems" :key="item.to">
            <RouterLink :to="item.to" class="nav-link" exact-active-class="is-active">
              <Icon :icon="item.icon" width="18" height="18" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </GlassPanel>
  </aside>
</template>

<style scoped lang="less">
.app-sidebar {
  height: 100%;
}

.app-sidebar__panel {
  height: 100%;
  min-height: calc(100vh - var(--space-8));
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.app-sidebar__nav-wrap {
  flex: 1;
  display: flex;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.brand__logo {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  background: linear-gradient(135deg, #7dd3fc 0%, #a7f3d0 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.brand__copy {
  display: grid;
  gap: 2px;
}

.brand__title {
  font-size: 14px;
  color: var(--color-text);
}

.brand__subtitle {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  border-radius: 12px;
  padding: 12px 14px;
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: all 180ms ease;
}

.nav-link:hover {
  color: var(--color-text);
  background: rgba(148, 163, 184, 0.14);
}

.nav-link.is-active {
  color: var(--color-text);
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(16, 185, 129, 0.25));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.62);
}

@media (max-width: 960px) {
  .app-sidebar__panel {
    min-height: auto;
    padding: var(--space-4);
    gap: var(--space-4);
  }

  .app-sidebar__nav-wrap {
    display: block;
  }

  .nav-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .nav-link {
    justify-content: center;
    text-align: center;
  }
}
</style>
