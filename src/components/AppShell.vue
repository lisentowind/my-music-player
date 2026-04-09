<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import AppSidebar from "@/components/chrome/AppSidebar.vue";
import AppTopbar from "@/components/chrome/AppTopbar.vue";
import PlayerDock from "@/components/dock/PlayerDock.vue";
import { animateRouteEnter, animateRouteLeave } from "@/composables/use-gsap";

const route = useRoute();
const shellMinWidth = 1280;
const shellMode = computed(() => route.name === "player" ? "player" : "default");
</script>

<template>
  <div
    class="app-shell desktop-shell-min"
    data-testid="app-shell-layout"
    :data-min-width="String(shellMinWidth)"
    :data-shell-mode="shellMode"
  >
    <aside class="app-shell__sidebar" data-testid="app-shell-sidebar">
      <AppSidebar />
    </aside>

    <section class="app-shell__content">
      <AppTopbar class="app-shell__topbar" data-testid="app-shell-topbar" />

      <main class="app-shell__main">
        <div
          class="app-shell__scroll desktop-scroll-x"
          data-testid="app-shell-scroll"
          data-overflow-x="auto"
        >
          <RouterView v-slot="{ Component, route: currentRoute }">
            <Transition mode="out-in" :css="false" @enter="animateRouteEnter" @leave="animateRouteLeave">
              <component :is="Component" :key="currentRoute.fullPath" class="app-shell__page" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </section>

    <PlayerDock />
  </div>
</template>

<style scoped lang="less">
.app-shell {
  min-width: var(--layout-min-width);
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: var(--color-bg-canvas);
}

.app-shell__sidebar {
  position: fixed;
  top: var(--layout-gap);
  left: var(--layout-gap);
  width: var(--layout-sidebar-width);
  height: calc(100vh - (var(--layout-gap) * 2) - var(--layout-dock-space));
  z-index: var(--z-shell-sidebar);
}

.app-shell__content {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--space-4);
  height: 100vh;
  margin-left: calc(var(--layout-sidebar-width) + (var(--layout-gap) * 2));
  padding: var(--layout-gap) var(--layout-gap) calc(var(--layout-gap) + var(--layout-dock-space)) 0;
  min-width: calc(var(--layout-min-width) - var(--layout-sidebar-width) - (var(--layout-gap) * 3));
}

.app-shell__topbar {
  position: relative;
  z-index: var(--z-shell-topbar);
}

.app-shell__main {
  min-height: 0;
}

.app-shell__scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: auto;
  padding-right: var(--space-2);
  padding-bottom: var(--space-6);
}

.app-shell__page {
  min-width: calc(var(--layout-min-width) - var(--layout-sidebar-width) - (var(--layout-gap) * 3));
  min-height: 100%;
}

.app-shell[data-shell-mode="player"] .app-shell__content::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 160px;
  border-radius: 0 0 32px 32px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 82%);
  pointer-events: none;
  opacity: 0.9;
}
</style>
