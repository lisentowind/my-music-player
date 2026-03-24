<script setup lang="ts">
import GlassPanel from "@/components/chrome/GlassPanel.vue";
</script>

<template>
  <section id="profile-page" class="page profile-view">
    <section id="profile-overview">
      <GlassPanel class="block">
        <h2>个人中心</h2>
        <p>个人页框架已搭建，后续将接入头像、签名标签与统计模块。</p>
      </GlassPanel>
    </section>

    <section id="profile-activity">
      <GlassPanel class="block">
        <h3>近期动态</h3>
        <p>预留动态区，Task 7 将填充历史行为与推荐关联。</p>
      </GlassPanel>
    </section>

    <section id="profile-settings-entry">
      <GlassPanel class="block">
        <h3>偏好设置入口</h3>
        <p>保留设置挂点，后续任务补充可配置项。</p>
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
