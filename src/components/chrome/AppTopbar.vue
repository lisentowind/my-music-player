<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppSettingsDialog from "@/components/chrome/AppSettingsDialog.vue";
import GlassPanel from "@/components/chrome/GlassPanel.vue";
import UiSearchField from "@/components/ui/UiSearchField.vue";
import { useGsapHoverTargets, useGsapReveal } from "@/composables/use-gsap";
import { iconRegistry } from "@/components/ui/icon-registry";

interface SearchFieldExpose {
  focus: () => void;
  select: () => void;
}

const route = useRoute();
const router = useRouter();
const topbarRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<SearchFieldExpose | null>(null);
const settingsOpen = ref(false);

const isExplorePage = ref(route.name === "explore");

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
  isExplorePage.value = route.name === "explore";
  await focusSearchIfNeeded();
}, { immediate: true });

useGsapReveal(topbarRef, [".app-topbar__search-shell", ".app-topbar__action"], 0.14);
useGsapHoverTargets(topbarRef, [".app-topbar__action"], {
  hoverY: -2,
  hoverScale: 1.008,
});
</script>

<template>
  <header ref="topbarRef" class="app-topbar">
    <GlassPanel class="app-topbar__panel">
      <UiSearchField
        v-if="isExplorePage"
        ref="searchInputRef"
        class="app-topbar__search-shell"
        input-id="topbar-search-input"
        data-testid="topbar-search-input"
        size="compact"
        placeholder="搜索歌曲、歌单、标签或艺人"
        aria-label="探索页搜索输入框"
      />

      <button
        v-else
        type="button"
        class="app-topbar__jump app-topbar__action"
        data-testid="topbar-enter-explore"
        aria-label="进入探索"
        @click="enterExplore"
      >
        <span class="app-topbar__action-icon" aria-hidden="true">
          <Icon :icon="iconRegistry['solar:sun-outline']" />
        </span>
        <span class="app-topbar__action-label">进入探索</span>
      </button>

      <button
        type="button"
        class="app-topbar__settings app-topbar__action"
        data-testid="topbar-settings-button"
        aria-label="打开设置"
        @click="openSettings"
      >
        <span class="app-topbar__action-icon" aria-hidden="true">
          <Icon :icon="iconRegistry['solar:settings-minimalistic-outline']" />
        </span>
        <span class="app-topbar__action-label">设置</span>
      </button>
    </GlassPanel>

    <AppSettingsDialog v-model:open="settingsOpen" />
  </header>
</template>

<style scoped lang="less">
.app-topbar {
  position: relative;
  overflow: visible;
  isolation: isolate;
  display: flex;
  justify-content: flex-end;
}

.app-topbar__panel {
  width: max-content;
  max-width: min(100%, 560px);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 52px;
  padding: 5px;
  border: 1px solid var(--color-panel-border);
  border-radius: 999px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 88%, transparent), transparent 44%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-popover-glow-start) 74%, transparent), transparent 100%),
    color-mix(in srgb, var(--color-popover-fill) 94%, transparent);
  box-shadow:
    0 10px 22px color-mix(in srgb, var(--color-popover-shadow) 78%, transparent),
    inset 0 1px 0 var(--color-panel-glow-end);
  backdrop-filter: blur(22px) saturate(1.06);
}

.app-topbar__action {
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
    transform 180ms ease,
    width 220ms ease,
    padding 220ms ease,
    gap 220ms ease;
}

.app-topbar__search-shell {
  width: min(280px, 38vw);
  flex: 0 1 280px;
}

.app-topbar__action {
  width: 44px;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 0;
  color: var(--color-text);
  overflow: hidden;
}

.app-topbar__action:hover,
.app-topbar__action:focus-visible {
  width: 112px;
  justify-content: flex-start;
  gap: 8px;
  padding: 0 14px 0 8px;
  border-color: var(--color-state-border-emphasis);
  background: var(--color-control-surface-strong);
  box-shadow:
    var(--shadow-sm),
    inset 0 1px 0 var(--color-panel-glow-end);
}

.app-topbar__action-icon {
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 16%, transparent);
  color: var(--color-accent);
}

.app-topbar__jump .app-topbar__action-icon {
  background: var(--gradient-primary);
  color: var(--color-on-accent);
}

.app-topbar__action-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.app-topbar__action-label {
  color: var(--color-text-strong);
  font-size: 11px;
  font-weight: 680;
  white-space: nowrap;
  opacity: 0;
  max-width: 0;
  transform: translateX(-6px);
  transition:
    opacity 180ms ease,
    max-width 220ms ease,
    transform 220ms ease;
}

.app-topbar__action:hover .app-topbar__action-label,
.app-topbar__action:focus-visible .app-topbar__action-label {
  opacity: 1;
  max-width: 70px;
  transform: translateX(0);
}
</style>
