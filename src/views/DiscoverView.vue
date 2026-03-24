<script setup lang="ts">
import GlassPanel from "@/components/chrome/GlassPanel.vue";
</script>

<template>
  <section id="discover-page" class="page discover-view">
    <section id="discover-hero">
      <GlassPanel class="block">
        <h2>推荐</h2>
        <p>发现页骨架已建立，后续用于承接 Banner、推荐歌单与沉浸入口。</p>
      </GlassPanel>
    </section>

    <section id="discover-featured-albums">
      <GlassPanel class="block">
        <h3>精选专辑区域</h3>
        <p>Task 5 将补齐卡片数据与交互。</p>
      </GlassPanel>
    </section>

    <section id="discover-quick-picks">
      <GlassPanel class="block">
        <h3>快速播放入口</h3>
        <p>保留稳定挂点，供后续任务接入播放器行为。</p>
      </GlassPanel>
    </section>
  </section>
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
