<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import AppSidebar from "@/components/chrome/AppSidebar.vue";
import AppTopbar from "@/components/chrome/AppTopbar.vue";
import PlayerDock from "@/components/dock/PlayerDock.vue";
import { animateRouteEnter, animateRouteLeave } from "@/composables/use-gsap";

const route = useRoute();
const shellMinWidth = 1220;
const shellMinHeight = 760;
const isPlayerFullscreen = computed(() => route.name === "player");
const shellMode = computed(() => isPlayerFullscreen.value ? "player-fullscreen" : "default");
</script>

<template>
  <div
    class="app-shell desktop-shell-min"
    data-testid="app-shell-layout"
    :data-min-width="String(shellMinWidth)"
    :data-min-height="String(shellMinHeight)"
    :data-shell-mode="shellMode"
    data-shell-visual="stitch"
  >
    <aside
      v-if="!isPlayerFullscreen"
      class="app-shell__sidebar"
      data-testid="app-shell-sidebar"
      data-sidebar-visual="editorial"
    >
      <AppSidebar />
    </aside>

    <section class="app-shell__content" :class="{ 'app-shell__content--player': isPlayerFullscreen }">
      <AppTopbar
        v-if="!isPlayerFullscreen"
        class="app-shell__topbar"
        data-testid="app-shell-topbar"
        data-topbar-visual="floating"
        data-topbar-anchor="content-overlay"
      />

      <main class="app-shell__main">
        <div
          class="app-shell__scroll desktop-scroll-x"
          data-testid="app-shell-scroll"
          data-overflow-x="auto"
          data-scroll-style="overlay-floating"
          data-scroll-surface="transparent"
        >
          <RouterView v-slot="{ Component, route: currentRoute }">
            <Transition mode="out-in" :css="false" @enter="animateRouteEnter" @leave="animateRouteLeave">
              <component :is="Component" :key="currentRoute.fullPath" class="app-shell__page" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </section>

    <PlayerDock v-if="!isPlayerFullscreen" />
  </div>
</template>

<style scoped lang="less">
.app-shell {
  min-width: var(--layout-min-width);
  min-height: var(--layout-min-height);
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
  height: calc(100vh - (var(--layout-gap) * 2));
  z-index: var(--z-shell-sidebar);
}

.app-shell__content {
  position: relative;
  height: 100vh;
  margin-left: calc(var(--layout-sidebar-width) + (var(--layout-gap) * 2));
  padding: var(--layout-gap);
  min-width: calc(var(--layout-min-width) - var(--layout-sidebar-width) - (var(--layout-gap) * 3));
  overflow: hidden;
}

.app-shell__content--player {
  margin-left: 0;
  padding: 0;
  min-width: 100%;
}

.app-shell__topbar {
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  z-index: var(--z-shell-topbar);
}

.app-shell__main {
  position: relative;
  z-index: 1;
  height: 100%;
  min-height: 0;
}

.app-shell__scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: auto;
  padding: calc(var(--layout-topbar-height) + 38px) 0 calc(var(--layout-dock-space) + 12px);
}

.app-shell__content--player .app-shell__main,
.app-shell__content--player .app-shell__scroll {
  height: 100vh;
}

.app-shell__content--player .app-shell__scroll {
  padding: 0;
  overflow: hidden;
}

.app-shell__page {
  width: 100%;
  min-width: 100%;
  min-height: 100%;
}

.app-shell__content--player .app-shell__page {
  min-width: 100%;
}

.app-shell[data-shell-mode="player-fullscreen"] .app-shell__content::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 16%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 26%),
    radial-gradient(circle at 78% 76%, rgba(105, 246, 184, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 26%);
  pointer-events: none;
  opacity: 0.9;
}
</style>
