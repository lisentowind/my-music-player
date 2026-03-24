<script setup lang="ts">
import GlassPanel from "@/components/chrome/GlassPanel.vue";
</script>

<template>
  <main id="liked-page" class="page liked-view">
    <section id="liked-summary">
      <GlassPanel class="block">
        <h2>我喜欢</h2>
        <p>收藏页骨架已就位，后续接入喜欢歌曲与播放上下文。</p>
      </GlassPanel>
    </section>

    <section id="liked-track-list">
      <GlassPanel class="block">
        <h3>已喜欢歌曲列表</h3>
        <p>预留列表容器，Task 6 会填充数据与交互状态。</p>
      </GlassPanel>
    </section>

    <section id="liked-insights">
      <GlassPanel class="block">
        <h3>偏好洞察</h3>
        <p>预留信息区，用于展示本周听歌偏好摘要。</p>
      </GlassPanel>
    </section>
  </main>
</template>

<style scoped lang="less">
.page {
  display: grid;
  gap: var(--space-4);
}

.block {
  padding: var(--space-6);
}

h2,
h3 {
  margin: 0 0 8px;
  color: var(--color-text);
}

p {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
