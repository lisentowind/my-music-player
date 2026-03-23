<template>
  <section class="about">
    <header class="card about__hero">
      <h1>About My Player</h1>
      <p class="text-subtle">
        本项目是一个可扩展的桌面播放器起点工程，目标是快速接入业务模块，并保持前后端协作体验简洁稳定。
      </p>
    </header>

    <section class="card about__section">
      <h2>技术栈</h2>
      <ul>
        <li>桌面容器：Tauri 2 + Rust 命令接口</li>
        <li>前端框架：Vue 3 + TypeScript + Vue Router</li>
        <li>状态管理：Pinia</li>
        <li>样式方案：Less + UnoCSS（轻量工具类）</li>
      </ul>
    </section>

    <section class="card about__section">
      <h2>当前阶段目标</h2>
      <ul>
        <li>建立桌面默认首页和导航骨架，作为后续业务容器。</li>
        <li>保留最小可用的 Rust 原生命令调用链路，便于后续扩展。</li>
        <li>确保路由、状态管理、构建与桌面运行流程可稳定联调。</li>
      </ul>
    </section>
  </section>
</template>

<style scoped lang="less">
.about {
  display: grid;
  gap: var(--space-6);
}

h1,
h2 {
  margin: 0;
}

.about__hero,
.about__section {
  display: grid;
  gap: var(--space-4);
}

.about__hero p {
  margin: 0;
}

.about__section ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
  line-height: 1.6;
  color: var(--color-text);
}
</style>
