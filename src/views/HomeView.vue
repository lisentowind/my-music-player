<script setup lang="ts">
import { storeToRefs } from "pinia";
import GreetPanel from "@/components/GreetPanel.vue";
import RuntimeStatusCard from "@/components/RuntimeStatusCard.vue";
import { useCounterStore } from "@/stores/counter";

const counterStore = useCounterStore();
const { count, doubleCount } = storeToRefs(counterStore);

function incrementByOne() {
  counterStore.increment();
}

function incrementByFive() {
  counterStore.increment(5);
}
</script>

<template>
  <section class="home">
    <header class="card home__hero">
      <p class="home__kicker">Workspace Home</p>
      <h1>My Player 桌面工作区</h1>
      <p class="text-subtle">
        这是默认启动首页，聚焦运行基线与扩展入口，便于后续在此叠加真实业务模块。
      </p>
    </header>

    <section class="home__grid">
      <RuntimeStatusCard />
      <GreetPanel />
    </section>

    <section class="card home__counter">
      <div class="home__counter-header">
        <h2>启动状态（Pinia）</h2>
        <span class="text-subtle">基础状态链路校验区</span>
      </div>

      <div class="home__counter-values">
        <div>
          <p class="text-subtle">当前计数</p>
          <p class="home__counter-number">{{ count }}</p>
        </div>
        <div>
          <p class="text-subtle">派生值（x2）</p>
          <p class="home__counter-number">{{ doubleCount }}</p>
        </div>
      </div>

      <div class="home__counter-actions">
        <button type="button" @click="incrementByOne">+1</button>
        <button type="button" @click="incrementByFive">+5</button>
        <button type="button" class="is-light" @click="counterStore.reset">重置</button>
      </div>
    </section>

    <section class="card home__placeholder">
      <div class="home__placeholder-header">
        <h2>未来业务模块占位区</h2>
        <p class="text-subtle">此区块保留给播放器核心能力，当前仅提供结构占位，不承载业务逻辑。</p>
      </div>
      <div class="home__placeholder-grid">
        <article>
          <h3>播放队列面板</h3>
          <p class="text-subtle">预留：当前播放、下一首、拖拽排序、快捷操作。</p>
        </article>
        <article>
          <h3>本地媒体库</h3>
          <p class="text-subtle">预留：目录索引、标签筛选、搜索与分组展示。</p>
        </article>
        <article>
          <h3>设备与同步</h3>
          <p class="text-subtle">预留：多端状态、同步日志、冲突提示与恢复。</p>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped lang="less">
.home {
  display: grid;
  gap: var(--space-6);
}

.home__hero {
  display: grid;
  gap: var(--space-2);
}

.home__kicker {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0369a1;
}

h1 {
  margin: 0;
  font-size: clamp(28px, 4vw, 36px);
  line-height: 1.2;
}

h2 {
  margin: 0;
  font-size: 20px;
}

.home__hero p:last-child {
  margin: 0;
}

.home__grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.home__counter {
  display: grid;
  gap: var(--space-4);
}

.home__counter-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.home__counter-values {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.home__counter-values p {
  margin: 0;
}

.home__counter-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 6px !important;
}

.home__counter-actions {
  display: flex;
  gap: var(--space-2);
}

button {
  border: 0;
  border-radius: var(--radius-sm);
  padding: 8px 14px;
  font-weight: 600;
  color: #fff;
  background: #0284c7;
  cursor: pointer;
}

button.is-light {
  color: var(--color-text);
  background: #e2e8f0;
}

.home__placeholder {
  display: grid;
  gap: var(--space-4);
}

.home__placeholder-header {
  display: grid;
  gap: 6px;
}

.home__placeholder-header p {
  margin: 0;
}

.home__placeholder-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.home__placeholder-grid article {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-4);
}

.home__placeholder-grid h3 {
  margin: 0 0 8px;
  font-size: 15px;
}

.home__placeholder-grid p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .home__counter-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
