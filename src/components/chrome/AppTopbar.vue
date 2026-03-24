<script setup lang="ts">
import GlassPanel from "@/components/chrome/GlassPanel.vue";

defineProps<{
  title: string;
}>();
</script>

<template>
  <header class="app-topbar">
    <GlassPanel class="app-topbar__panel">
      <div class="meta">
        <h1 class="meta__title">{{ title }}</h1>
        <p class="meta__subtitle">页面框架已就绪，可继续填充音乐业务模块</p>
      </div>
      <div class="status" aria-label="页面状态">
        <span class="status__dot" />
        <span>结构稳定</span>
      </div>
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

.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
}

@media (max-width: 720px) {
  .app-topbar__panel {
    padding: var(--space-4);
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
