<script setup lang="ts">
import { RouterView } from "vue-router";
import AppSidebar from "@/components/chrome/AppSidebar.vue";
import PlayerDock from "@/components/dock/PlayerDock.vue";
import { animateRouteEnter, animateRouteLeave } from "@/composables/use-gsap";
</script>

<template>
  <div class="app-shell" data-testid="app-shell-layout">
    <aside class="app-shell__sidebar" data-testid="app-shell-sidebar">
      <AppSidebar />
    </aside>
    <div class="app-shell__content">
      <main class="app-shell__main">
        <div class="app-shell__scroll" data-testid="app-shell-scroll">
          <RouterView v-slot="{ Component, route }">
            <Transition mode="out-in" :css="false" @enter="animateRouteEnter" @leave="animateRouteLeave">
              <component :is="Component" :key="route.fullPath" class="app-shell__page" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </div>
    <PlayerDock />
  </div>
</template>

<style scoped lang="less">
.app-shell {
  --shell-top-offset: var(--layout-gap);
  --shell-left-offset: var(--layout-gap);
  --shell-right-offset: var(--layout-gap);
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: var(--color-bg-canvas);
}

.app-shell__sidebar {
  position: fixed;
  top: var(--shell-top-offset);
  left: var(--shell-left-offset);
  width: var(--layout-sidebar-width);
  height: calc(100vh - (var(--layout-gap) * 2) - var(--layout-dock-space));
  z-index: 32;
}

.app-shell__content {
  margin-left: calc(var(--layout-sidebar-width) + (var(--layout-gap) * 2));
  padding: var(--layout-gap) var(--shell-right-offset) calc(var(--layout-gap) + var(--layout-dock-space)) 0;
  height: 100vh;
  min-width: 0;
}

.app-shell__main {
  height: calc(100vh - (var(--layout-gap) * 2) - var(--layout-dock-space));
  min-height: 0;
}

.app-shell__scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 var(--space-2) var(--space-6) 0;
}

.app-shell__page {
  min-height: 100%;
}

@media (max-width: 960px) {
  .app-shell {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .app-shell__sidebar {
    position: static;
    width: auto;
    height: auto;
    margin: var(--layout-gap) var(--layout-gap) 0;
  }

  .app-shell__content {
    margin-left: 0;
    padding: var(--layout-gap);
    padding-bottom: calc(var(--layout-gap) + 168px);
    height: auto;
  }

  .app-shell__main {
    height: auto;
  }

  .app-shell__scroll {
    height: auto;
    overflow: visible;
    padding-right: 0;
  }
}
</style>
