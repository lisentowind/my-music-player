<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import GlassPanel from "@/components/chrome/GlassPanel.vue";
import { useGsapHoverTargets, useGsapReveal } from "@/composables/use-gsap";
import { iconRegistry } from "@/components/ui/icon-registry";

const route = useRoute();
const router = useRouter();
const topbarRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

const descriptions: Record<string, string> = {
  home: "在统一的深色氛围里快速进入今日推荐与主打歌单。",
  explore: "直接搜索歌曲、歌手、标签和氛围，作为全站内容入口。",
  playlist: "围绕歌单视角浏览封面、简介与编排节奏。",
  "playlist-detail": "查看歌单详情、曲目脉络与延伸内容。",
  library: "把收藏、最近播放和下载内容集中到一个资料区。",
  player: "保留同一套壳层，同时切入更沉浸的全屏播放器视觉。",
};

const title = computed(() => {
  if (typeof route.meta?.title === "string") {
    return route.meta.title;
  }

  return "音乐空间";
});

const description = computed(() => descriptions[String(route.name ?? "")] ?? "统一浏览当前页面内容。");
const isExplorePage = computed(() => route.name === "explore");

async function focusSearchIfNeeded() {
  if (!isExplorePage.value || route.query.focus !== "search") {
    return;
  }

  await nextTick();
  const target = searchInputRef.value;
  if (!target) {
    return;
  }

  target.focus();
  target.select();
}

async function enterExplore() {
  await router.push({
    name: "explore",
    query: { focus: "search" },
  });
}

watch(() => [route.name, route.query.focus].join("::"), async () => {
  await focusSearchIfNeeded();
}, { immediate: true });

useGsapReveal(topbarRef, [".app-topbar__meta", ".app-topbar__search-shell", ".app-topbar__action"], 0.14);
useGsapHoverTargets(topbarRef, [".app-topbar__search-shell", ".app-topbar__action"], {
  hoverY: -2,
  hoverScale: 1.008,
});
</script>

<template>
  <header ref="topbarRef" class="app-topbar">
    <GlassPanel class="app-topbar__panel">
      <div class="app-topbar__meta flex items-center gap-4">
        <div class="app-topbar__mark" aria-hidden="true">
          <Icon :icon="iconRegistry['solar:music-notes-outline']" />
        </div>
        <div class="app-topbar__copy">
          <span class="app-topbar__eyebrow">当前页面</span>
          <h1 class="app-topbar__title">{{ title }}</h1>
          <p class="app-topbar__subtitle">{{ description }}</p>
        </div>
      </div>

      <div class="app-topbar__center">
        <label
          v-if="isExplorePage"
          class="app-topbar__search-shell flex items-center gap-3"
          for="topbar-search-input"
        >
          <span class="app-topbar__search-icon" aria-hidden="true">
            <Icon :icon="iconRegistry['solar:sun-outline']" />
          </span>
          <input
            id="topbar-search-input"
            ref="searchInputRef"
            class="app-topbar__search-input"
            data-testid="topbar-search-input"
            type="search"
            autocomplete="off"
            placeholder="搜索歌曲、歌单、情绪或创作者"
            aria-label="探索页搜索输入框"
          >
        </label>

        <button
          v-else
          type="button"
          class="app-topbar__jump app-topbar__action"
          data-testid="topbar-enter-explore"
          @click="enterExplore"
        >
          <span class="app-topbar__jump-copy">
            <span class="app-topbar__jump-label">进入探索</span>
            <span class="app-topbar__jump-hint">把搜索入口固定放在顶部中央</span>
          </span>
          <span class="app-topbar__jump-icon" aria-hidden="true">
            <Icon :icon="iconRegistry['solar:sun-outline']" />
          </span>
        </button>
      </div>

      <div class="app-topbar__actions">
        <button
          type="button"
          class="app-topbar__status app-topbar__action"
          data-testid="topbar-status-button"
          aria-label="应用状态：在线内容和播放器服务已就绪"
        >
          <span class="app-topbar__status-dot" aria-hidden="true" />
          <span class="app-topbar__status-copy">
            <span class="app-topbar__status-title">应用状态</span>
            <span class="app-topbar__status-text">在线就绪</span>
          </span>
        </button>

        <button
          type="button"
          class="app-topbar__profile app-topbar__action"
          data-testid="topbar-profile-button"
          aria-label="个人资料与资料库入口"
        >
          <span class="app-topbar__profile-avatar" aria-hidden="true">
            <Icon :icon="iconRegistry['solar:user-outline']" />
          </span>
          <span class="app-topbar__profile-copy">
            <span class="app-topbar__profile-label">个人资料</span>
            <span class="app-topbar__profile-name">夜航档案</span>
          </span>
        </button>
      </div>
    </GlassPanel>
  </header>
</template>

<style scoped lang="less">
.app-topbar {
  position: relative;
}

.app-topbar__panel {
  display: grid;
  grid-template-columns: minmax(260px, 1.1fr) minmax(280px, 1fr) auto;
  align-items: center;
  gap: var(--space-4);
  min-height: var(--layout-topbar-height);
  padding: 18px 22px;
}

.app-topbar__mark {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--color-accent) 28%, transparent);
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 46%),
    color-mix(in srgb, var(--color-control-surface-strong) 86%, transparent);
  color: var(--color-text-contrast);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.app-topbar__mark :deep(svg) {
  width: 22px;
  height: 22px;
}

.app-topbar__copy {
  min-width: 0;
}

.app-topbar__eyebrow {
  display: inline-flex;
  margin-bottom: 6px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.app-topbar__title {
  margin: 0;
  color: var(--color-text-strong);
  font-size: 28px;
  line-height: 1.06;
}

.app-topbar__subtitle {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.app-topbar__center {
  display: flex;
  justify-content: center;
}

.app-topbar__search-shell,
.app-topbar__jump,
.app-topbar__status,
.app-topbar__profile {
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 20px;
  background: color-mix(in srgb, var(--color-control-surface) 92%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.app-topbar__search-shell:hover,
.app-topbar__jump:hover,
.app-topbar__status:hover,
.app-topbar__profile:hover {
  border-color: var(--color-state-border-emphasis);
  background: color-mix(in srgb, var(--color-control-surface-strong) 90%, transparent);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.18);
}

.app-topbar__search-shell {
  width: min(560px, 100%);
  min-height: 62px;
  padding: 0 18px;
}

.app-topbar__search-icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.app-topbar__search-input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 15px;
}

.app-topbar__search-input::placeholder {
  color: var(--color-text-tertiary);
}

.app-topbar__jump {
  min-width: 320px;
  min-height: 62px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
  cursor: pointer;
  color: var(--color-text);
}

.app-topbar__jump-copy {
  display: grid;
  gap: 4px;
  text-align: left;
}

.app-topbar__jump-label {
  font-size: 15px;
  font-weight: 600;
}

.app-topbar__jump-hint {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.app-topbar__jump-icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--gradient-primary);
  color: var(--color-text-contrast);
}

.app-topbar__actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.app-topbar__action {
  cursor: pointer;
}

.app-topbar__status,
.app-topbar__profile {
  min-height: 62px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  color: var(--color-text);
}

.app-topbar__status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #63f0be, #2bc896);
  box-shadow: 0 0 0 6px rgba(67, 201, 147, 0.12);
}

.app-topbar__status-copy,
.app-topbar__profile-copy {
  display: grid;
  gap: 4px;
  text-align: left;
}

.app-topbar__status-title,
.app-topbar__profile-label {
  color: var(--color-text-tertiary);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-topbar__status-text,
.app-topbar__profile-name {
  font-size: 14px;
  font-weight: 600;
}

.app-topbar__profile-avatar {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--gradient-primary);
  color: var(--color-text-contrast);
}

.app-topbar__profile-avatar :deep(svg) {
  width: 18px;
  height: 18px;
}
</style>
