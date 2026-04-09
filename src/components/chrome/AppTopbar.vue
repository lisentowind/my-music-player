<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import GlassPanel from "@/components/chrome/GlassPanel.vue";
import UiIconButton from "@/components/ui/UiIconButton.vue";
import { iconRegistry } from "@/components/ui/icon-registry";
import UiThemePalette from "@/components/ui/UiThemePalette.vue";
import UiThemeToggle from "@/components/ui/UiThemeToggle.vue";
import { animatePopoverEnter, animatePopoverLeave } from "@/composables/use-gsap";
import type { ThemeMode } from "@/stores/theme";
import { useThemeStore } from "@/stores/theme";

const route = useRoute();
const themeStore = useThemeStore();
const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const settingsIcon = iconRegistry["solar:settings-minimalistic-outline"];
const musicIcon = iconRegistry["solar:music-notes-outline"];
const monitorIcon = iconRegistry["solar:monitor-outline"];
const sunIcon = iconRegistry["solar:sun-outline"];

const title = computed(() => {
  if (typeof route.meta?.title === "string") {
    return route.meta.title;
  }

  return "";
});

const themeMode = computed<ThemeMode>({
  get: () => themeStore.mode,
  set: value => themeStore.setMode(value),
});

const customColorModel = computed({
  get: () => themeStore.customColor || themeStore.themeColor,
  set: value => themeStore.setCustomColor(value),
});
const resolvedModeLabel = computed(() => (themeStore.resolvedMode === "dark" ? "深色氛围" : "浅色氛围"));
const themeAccentLabel = computed(() => themeStore.activePreset?.name || "自由主题色");

function onSelectPreset(presetId: string) {
  themeStore.setPreset(presetId);
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function handlePointerDown(event: MouseEvent) {
  if (!menuOpen.value) {
    return;
  }

  const target = event.target as Node | null;
  if (target && menuRef.value?.contains(target)) {
    return;
  }

  closeMenu();
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    closeMenu();
  }
}

onMounted(() => {
  window.addEventListener("mousedown", handlePointerDown);
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousedown", handlePointerDown);
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <header class="app-topbar">
    <GlassPanel class="app-topbar__panel">
      <div class="meta">
        <p class="meta__eyebrow">Now browsing</p>
        <h1 class="meta__title">{{ title }}</h1>
        <p class="meta__subtitle">Scroll-ready</p>
      </div>
      <div ref="menuRef" class="toolbar">
        <UiIconButton
          icon="solar:settings-minimalistic-outline"
          label="打开外观菜单"
          size="sm"
          variant="soft"
          :pressed="menuOpen"
          data-testid="topbar-menu-trigger"
          @click="toggleMenu"
        />
        <transition
          :css="false"
          @enter="animatePopoverEnter"
          @leave="animatePopoverLeave"
        >
          <div
            v-if="menuOpen"
            class="menu-popover"
            data-testid="topbar-theme-controls"
          >
            <div class="menu-popover__hero">
              <div class="menu-popover__hero-icon" aria-hidden="true">
                <Icon :icon="settingsIcon" />
              </div>
              <div class="menu-popover__hero-copy">
                <span class="menu-popover__eyebrow">
                  <Icon :icon="musicIcon" />
                  Appearance
                </span>
                <strong class="menu-popover__title">外观控制台</strong>
                <p class="menu-popover__subtitle">模式、主题色和氛围会立即同步到整个播放器。</p>
              </div>
              <div class="status" aria-label="页面状态">
                <span class="status__dot" aria-hidden="true" />
                <span class="status__title">已就绪</span>
              </div>
            </div>
            <div class="menu-popover__section theme-controls">
              <div class="menu-popover__section-head">
                <span class="menu-popover__section-label">
                  <Icon :icon="monitorIcon" />
                  模式
                </span>
                <span class="menu-popover__section-note">{{ resolvedModeLabel }}</span>
              </div>
              <div class="theme-controls__group" data-testid="topbar-theme-toggle">
                <UiThemeToggle
                  v-model="themeMode"
                  :resolved-mode="themeStore.resolvedMode"
                />
              </div>
            </div>
            <div class="menu-popover__section theme-controls theme-controls--palette">
              <div class="menu-popover__section-head">
                <span class="menu-popover__section-label">
                  <Icon :icon="sunIcon" />
                  主题色
                </span>
                <span class="menu-popover__section-note">{{ themeAccentLabel }}</span>
              </div>
              <div class="theme-controls__group">
                <UiThemePalette
                  v-model="customColorModel"
                  :presets="themeStore.presets"
                  :active-preset-id="themeStore.activePresetId"
                  @select-preset="onSelectPreset"
                />
              </div>
            </div>
          </div>
        </transition>
      </div>
    </GlassPanel>
  </header>
</template>

<style scoped lang="less">
.app-topbar {
  position: relative;
  z-index: 5;
}

.app-topbar__panel {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 14px 18px;
}

.toolbar {
  position: relative;
  display: flex;
  justify-content: flex-end;
  margin-left: auto;
  z-index: 3;
}

.menu-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 336px;
  max-width: min(396px, calc(100vw - 40px));
  overflow: hidden;
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 20%, var(--color-state-border-subtle));
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 34%),
    linear-gradient(180deg, var(--color-popover-glow-start), var(--color-popover-glow-end)),
    var(--color-popover-fill);
  box-shadow:
    0 26px 82px var(--color-popover-shadow),
    0 10px 26px color-mix(in srgb, var(--color-popover-shadow) 68%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(30px) saturate(175%);
  -webkit-backdrop-filter: blur(30px) saturate(175%);
  z-index: 6;
}

.menu-popover::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent 30%);
  pointer-events: none;
}

.menu-popover__hero {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 10px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 18%, var(--color-state-border-subtle));
  border-radius: 16px;
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--color-accent) 12%, rgba(255, 255, 255, 0.7)), color-mix(in srgb, var(--color-control-surface) 90%, transparent)),
    color-mix(in srgb, var(--color-panel-fill) 92%, rgba(255, 255, 255, 0.08));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 14px 36px rgba(15, 23, 42, 0.12);
}

.menu-popover__hero-icon {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--color-accent) 28%, transparent);
  border-radius: 14px;
  background: var(--gradient-primary);
  color: #f8fbff;
  box-shadow: var(--shadow-primary-hover);
}

.menu-popover__hero-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.menu-popover__hero-copy {
  min-width: 0;
}

.menu-popover__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.menu-popover__eyebrow :deep(svg) {
  width: 14px;
  height: 14px;
}

.menu-popover__title {
  display: block;
  margin: 0;
  color: var(--color-text-strong);
  font-size: 14px;
  line-height: 1.1;
}

.menu-popover__subtitle {
  margin: 6px 0 0;
  color: var(--color-text);
  font-size: 11px;
  line-height: 1.45;
  opacity: 0.84;
}

.menu-popover__section + .menu-popover__section {
  margin-top: 8px;
}

.menu-popover__section {
  position: relative;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 10%, var(--color-state-border-subtle));
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), transparent 45%),
    color-mix(in srgb, var(--color-control-surface-strong) 92%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 12px 28px color-mix(in srgb, var(--color-popover-shadow) 35%, transparent);
}

.menu-popover__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.menu-popover__section-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-strong);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.menu-popover__section-label :deep(svg) {
  width: 14px;
  height: 14px;
  color: var(--color-accent);
}

.menu-popover__section-note {
  color: var(--color-text-secondary);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.meta__eyebrow {
  margin: 0 0 4px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.meta__title {
  margin: 0;
  font-size: 22px;
  color: var(--color-text-strong);
}

.meta__subtitle {
  margin: 4px 0 0;
  color: var(--color-text-tertiary);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: start;
  padding: 7px 10px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 18%, var(--color-state-border-subtle));
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-control-surface-strong) 92%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.status__dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 999px;
  background: var(--color-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.status__title {
  color: var(--color-text-secondary);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.theme-controls {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.theme-controls__group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
}

.theme-controls--palette .theme-controls__group {
  width: 100%;
}

@media (max-width: 720px) {
  .app-topbar__panel {
    padding: var(--space-4);
    align-items: flex-start;
  }

  .toolbar {
    margin-left: 0;
  }

  .menu-popover {
    right: 0;
    left: auto;
    min-width: min(336px, calc(100vw - 24px));
    max-width: min(336px, calc(100vw - 24px));
  }

  .menu-popover__hero {
    grid-template-columns: auto 1fr;
  }

  .status {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .menu-popover__section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .theme-controls__group {
    justify-content: flex-start;
  }
}
</style>
