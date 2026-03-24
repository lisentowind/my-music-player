<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppearanceControls from "@/components/chrome/AppearanceControls.vue";
import GlassPanel from "@/components/chrome/GlassPanel.vue";

const route = useRoute();
const title = computed(() => {
  if (typeof route.meta?.title === "string") {
    return route.meta.title;
  }

  return "";
});
</script>

<template>
  <header class="app-topbar">
    <GlassPanel class="app-topbar__panel">
      <div class="meta">
        <h1 class="meta__title">{{ title }}</h1>
        <p class="meta__subtitle">页面框架已就绪，可继续填充音乐业务模块</p>
      </div>
      <AppearanceControls class="app-topbar__appearance" />
    </GlassPanel>
  </header>
</template>

<style scoped lang="less">
.app-topbar__panel {
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.meta__title {
  margin: 0;
  font-size: 24px;
  color: var(--color-text);
}

.meta__subtitle {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.app-topbar__appearance {
  justify-items: end;
}

@media (max-width: 720px) {
  .app-topbar__panel {
    padding: var(--space-4);
    flex-direction: column;
    align-items: flex-start;
  }

  .app-topbar__appearance {
    width: 100%;
    justify-items: stretch;
  }
}
</style>
