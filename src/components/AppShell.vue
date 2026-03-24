<script setup lang="ts">
import { RouterView } from "vue-router";
import AppSidebar from "@/components/chrome/AppSidebar.vue";
import AppTopbar from "@/components/chrome/AppTopbar.vue";
</script>

<template>
  <div class="app-shell">
    <AppSidebar class="app-shell__sidebar" />
    <div class="app-shell__content">
      <AppTopbar />
      <main class="app-shell__main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped lang="less">
.app-shell {
  min-height: 100vh;
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
}

.app-shell__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.app-shell__main {
  flex: 1;
  min-height: 0;
}

@media (max-width: 960px) {
  .app-shell {
    flex-direction: column;
    padding: var(--space-4);
  }

  .app-shell__sidebar {
    width: 100%;
  }
}
</style>
