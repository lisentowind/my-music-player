<script setup lang="ts">
import { RouterView } from "vue-router";
import AppSidebar from "@/components/chrome/AppSidebar.vue";
import AppTopbar from "@/components/chrome/AppTopbar.vue";
import PlayerDock from "@/components/dock/PlayerDock.vue";
</script>

<template>
  <div class="app-shell" data-testid="app-shell-root">
    <AppSidebar class="app-shell__sidebar" data-testid="app-shell-sidebar" />
    <div class="app-shell__content">
      <AppTopbar />
      <main class="app-shell__scroll app-scroll-area" data-testid="app-shell-scroll">
        <RouterView />
      </main>
    </div>
    <PlayerDock />
  </div>
</template>

<style scoped lang="less">
.app-shell {
  --app-shell-dock-space: 104px;
  height: 100vh;
  overflow: hidden;
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  background:
    radial-gradient(980px 560px at 115% -15%, rgba(56, 189, 248, 0.18), transparent 50%),
    radial-gradient(880px 500px at -25% 105%, rgba(129, 140, 248, 0.14), transparent 52%),
    linear-gradient(155deg, #eff4ff 0%, #eefaf7 100%),
    var(--color-bg);
}

.app-shell__sidebar {
  width: 250px;
  flex-shrink: 0;
  min-height: 0;
}

.app-shell__content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: calc(var(--space-4) + var(--app-shell-dock-space));
}

.app-shell__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}

@media (max-width: 960px) {
  .app-shell {
    --app-shell-dock-space: 168px;
    height: auto;
    min-height: 100vh;
    overflow: visible;
    flex-direction: column;
    padding: var(--space-4);
  }

  .app-shell__sidebar {
    width: 100%;
  }

  .app-shell__content {
    padding-bottom: calc(var(--space-3) + var(--app-shell-dock-space));
  }
}
</style>
