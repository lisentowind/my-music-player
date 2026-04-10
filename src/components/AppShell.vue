<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import AppSidebar from "@/components/chrome/AppSidebar.vue";
import AppTopbar from "@/components/chrome/AppTopbar.vue";
import PlayerDock from "@/components/dock/PlayerDock.vue";
import UiThemeToggle from "@/components/ui/UiThemeToggle.vue";
import { animateRouteEnter, animateRouteLeave } from "@/composables/use-gsap";
import { useThemeStore } from "@/stores/theme";

const route = useRoute();
const theme = useThemeStore();
const shellMinWidth = 1220;
const shellMinHeight = 760;
const isPlayerFullscreen = computed(() => route.name === "player");
const shellMode = computed(() => isPlayerFullscreen.value ? "player-fullscreen" : "default");
const scrollRef = ref<HTMLElement | null>(null);

watch(() => route.fullPath, async () => {
  await nextTick();
  scrollRef.value?.scrollTo({
    top: 0,
    behavior: "auto",
  });
});
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
      <div
        v-if="!isPlayerFullscreen"
        class="app-shell__chrome"
      >
        <UiThemeToggle
          class="app-shell__theme-toggle"
          data-testid="app-shell-theme-toggle"
          :model-value="theme.mode"
          :resolved-mode="theme.resolvedMode"
          @update:model-value="theme.setMode"
        />
        <AppTopbar
          class="app-shell__topbar"
          data-testid="app-shell-topbar"
          data-topbar-visual="floating"
          data-topbar-anchor="content-overlay"
        />
      </div>

      <main class="app-shell__main">
        <div
          ref="scrollRef"
          class="app-shell__scroll desktop-scroll-x"
          data-testid="app-shell-scroll"
          data-overflow-x="auto"
          data-scroll-style="overlay-floating"
          data-scroll-surface="transparent"
        >
          <RouterView v-slot="{ Component }">
            <Transition mode="out-in" :css="false" @enter="animateRouteEnter" @leave="animateRouteLeave">
              <component :is="Component" class="app-shell__page" />
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
  overflow: visible;
}

.app-shell__content--player {
  margin-left: 0;
  padding: 0;
  min-width: 100%;
}

.app-shell__chrome {
  position: absolute;
  top: 8px;
  right: var(--layout-gap);
  left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
  max-width: calc(100% - (var(--layout-gap) * 2));
  z-index: var(--z-shell-topbar);
}

.app-shell__topbar {
  position: relative;
  width: max-content;
  max-width: 100%;
}

.app-shell__theme-toggle {
  flex: 0 0 auto;
  padding: 5px 7px 5px 8px;
  border: 1px solid var(--color-panel-border);
  border-radius: 999px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 88%, transparent), transparent 44%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-popover-glow-start) 74%, transparent), transparent 100%),
    color-mix(in srgb, var(--color-popover-fill) 94%, transparent);
  box-shadow:
    0 10px 22px color-mix(in srgb, var(--color-popover-shadow) 78%, transparent),
    inset 0 1px 0 var(--color-panel-glow-end);
  backdrop-filter: blur(22px) saturate(1.06);
}

.app-shell__theme-toggle :deep(.ui-theme-toggle) {
  gap: 4px;
}

.app-shell__theme-toggle :deep(.ui-icon-button) {
  --ui-icon-button-size: 34px;
  --ui-icon-size: 16px;
  --ui-icon-button-bg: transparent;
  --ui-icon-button-border: color-mix(in srgb, var(--color-border) 72%, transparent);
  --ui-icon-button-shadow: none;
  --ui-icon-button-color: var(--color-text-secondary);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 58%, transparent), transparent 100%),
    color-mix(in srgb, var(--color-control-surface) 96%, transparent);
}

.app-shell__theme-toggle :deep(.ui-icon-button:hover) {
  box-shadow: none;
}

.app-shell__theme-toggle :deep(.ui-icon-button.is-pressed) {
  --ui-icon-button-border: color-mix(in srgb, var(--color-accent) 34%, transparent);
  --ui-icon-button-bg: color-mix(in srgb, var(--color-accent) 18%, var(--color-control-surface-strong));
  --ui-icon-button-color: var(--color-accent-pressed);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 18%, transparent),
    0 10px 22px color-mix(in srgb, var(--color-accent) 16%, transparent);
}

.app-shell__theme-toggle :deep(.ui-theme-toggle__resolved) {
  min-width: 28px;
  margin-left: 4px;
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: none;
}

.app-shell__main {
  position: relative;
  z-index: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.app-shell__scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: auto;
  padding: calc(var(--layout-topbar-height) + 16px) var(--layout-gap) calc(var(--layout-dock-space) + 12px);
}

.app-shell__content--player .app-shell__main,
.app-shell__content--player .app-shell__scroll {
  height: 100vh;
}

.app-shell__content--player .app-shell__scroll {
  padding: 0;
  overflow: hidden;
  scrollbar-width: none;
}

.app-shell__content--player .app-shell__scroll::-webkit-scrollbar {
  display: none;
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
    radial-gradient(circle at 78% 76%, color-mix(in srgb, var(--color-accent) 11%, transparent), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 26%);
  pointer-events: none;
  opacity: 0.9;
}
</style>
