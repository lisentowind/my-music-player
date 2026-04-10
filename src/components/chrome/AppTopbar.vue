<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppSettingsDialog from "@/components/chrome/AppSettingsDialog.vue";
import GlassPanel from "@/components/chrome/GlassPanel.vue";
import { useGsapHoverTargets, useGsapReveal } from "@/composables/use-gsap";
import { iconRegistry } from "@/components/ui/icon-registry";

const route = useRoute();
const router = useRouter();
const topbarRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const settingsOpen = ref(false);

const descriptions: Record<string, string> = {
  home: "从主打歌单、推荐混音和最近播放里继续接上当前氛围。",
  explore: "按歌名、艺人、专辑和标签快速找到下一段声场。",
  playlist: "围绕歌单封面、标签和曲目编排进入完整上下文。",
  "playlist-detail": "在歌单详情里继续展开曲目脉络和延伸氛围。",
  library: "把收藏、最近播放和个人资料库集中到一个统一画布里。",
  player: "切进沉浸播放器，把封面、歌词和控制聚到同一视角。",
};

const title = computed(() => typeof route.meta?.title === "string" ? route.meta.title : "音乐空间");
const description = computed(() => descriptions[String(route.name ?? "")] ?? "统一浏览当前页面内容。");
const isExplorePage = computed(() => route.name === "explore");

async function focusSearchIfNeeded() {
  if (!isExplorePage.value || route.query.focus !== "search") {
    return;
  }

  await nextTick();
  searchInputRef.value?.focus();
  searchInputRef.value?.select();
}

async function enterExplore() {
  await router.push({
    name: "explore",
    query: { focus: "search" },
  });
}

function openSettings() {
  settingsOpen.value = true;
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
          class="app-topbar__settings app-topbar__action"
          data-testid="topbar-settings-button"
          aria-label="打开设置"
          @click="openSettings"
        >
          <span class="app-topbar__settings-icon" aria-hidden="true">
            <Icon :icon="iconRegistry['solar:settings-minimalistic-outline']" />
          </span>
          <span class="app-topbar__settings-label">设置</span>
        </button>
      </div>
    </GlassPanel>

    <AppSettingsDialog v-model:open="settingsOpen" />
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
  padding: 6px 12px;
  border: 1px solid var(--color-panel-border);
  border-radius: 999px;
  background:
    linear-gradient(180deg, var(--color-panel-glow-start), transparent 46%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-surface-strong) 52%, transparent), transparent 100%),
    var(--color-panel-fill);
  box-shadow:
    var(--shadow-sm),
    inset 0 1px 0 var(--color-panel-glow-end);
  backdrop-filter: blur(18px);
}

.app-topbar__mark {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--color-control-surface-strong);
  color: var(--color-accent);
}

.app-topbar__mark :deep(svg) {
  width: 16px;
  height: 16px;
}

.app-topbar__eyebrow {
  display: inline-flex;
  margin-bottom: 4px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.app-topbar__title {
  margin: 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: 18px;
  line-height: 1;
  letter-spacing: -0.04em;
}

.app-topbar__subtitle {
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-size: 10px;
  line-height: 1.5;
}

.app-topbar__center {
  display: flex;
  justify-content: center;
}

.app-topbar__search-shell,
.app-topbar__jump,
.app-topbar__settings {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 80%, transparent), transparent 100%),
    var(--color-control-surface);
  box-shadow: inset 0 1px 0 var(--color-panel-glow-end);
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.app-topbar__search-shell:hover,
.app-topbar__jump:hover,
.app-topbar__settings:hover {
  border-color: var(--color-state-border-emphasis);
  background: var(--color-control-surface-strong);
  box-shadow:
    var(--shadow-sm),
    inset 0 1px 0 var(--color-panel-glow-end);
}

.app-topbar__search-shell {
  width: min(560px, 100%);
  min-height: 42px;
  padding: 0 14px;
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
  background: transparent;
  color: var(--color-text);
  font-size: 12px;
}

.app-topbar__search-input::placeholder {
  color: var(--color-text-tertiary);
}

.app-topbar__jump {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 10px 0 16px;
  color: var(--color-text);
}

.app-topbar__jump-copy {
  display: grid;
}

.app-topbar__jump-label {
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: 12px;
  font-weight: 800;
}

.app-topbar__jump-hint {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.app-topbar__jump-icon,
.app-topbar__settings-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}

.app-topbar__jump-icon {
  width: 28px;
  height: 28px;
  background: var(--gradient-primary);
  color: var(--color-on-accent);
}

.app-topbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-topbar__settings {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  color: var(--color-text);
}

.app-topbar__settings-icon {
  width: 28px;
  height: 28px;
  background: color-mix(in srgb, var(--color-accent) 16%, transparent);
  color: var(--color-accent);
}

.app-topbar__settings-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.app-topbar__settings-label {
  color: var(--color-text-strong);
  font-size: 12px;
  font-weight: 700;
}
</style>
