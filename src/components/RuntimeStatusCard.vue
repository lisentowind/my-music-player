<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { getRuntimeSnapshot } from "@/lib/tauri";

const route = useRoute();

const runtime = computed(() => getRuntimeSnapshot(route.path, route.name?.toString()));
</script>

<template>
  <section class="card status-card">
    <header class="status-card__header">
      <h2 class="status-card__title">运行时状态</h2>
      <span class="status-card__badge">{{ runtime.runtimeLabel }}</span>
    </header>

    <dl class="status-list">
      <div class="status-item">
        <dt>当前路由</dt>
        <dd>{{ runtime.routeName }}</dd>
      </div>
      <div class="status-item">
        <dt>路由地址</dt>
        <dd>{{ runtime.routePath }}</dd>
      </div>
      <div class="status-item">
        <dt>浏览器标识</dt>
        <dd class="status-item__ua">{{ runtime.userAgent }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped lang="less">
.status-card {
  display: grid;
  gap: var(--space-4);
}

.status-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.status-card__title {
  margin: 0;
  font-size: 18px;
}

.status-card__badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  background-color: #e0f2fe;
  border: 1px solid #bae6fd;
}

.status-list {
  margin: 0;
  display: grid;
  gap: var(--space-2);
}

.status-item {
  display: grid;
  gap: 2px;
}

.status-item dt {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.status-item dd {
  margin: 0;
  font-size: 14px;
  color: var(--color-text);
}

.status-item__ua {
  word-break: break-all;
}
</style>
