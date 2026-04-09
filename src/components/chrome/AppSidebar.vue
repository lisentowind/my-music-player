<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import UiSectionCard from "@/components/ui/UiSectionCard.vue";
import UiIconButton from "@/components/ui/UiIconButton.vue";
import UiThemePalette from "@/components/ui/UiThemePalette.vue";
import UiThemeToggle from "@/components/ui/UiThemeToggle.vue";
import { iconRegistry } from "@/components/ui/icon-registry";
import { animatePopoverEnter, animatePopoverLeave, useGsapReveal } from "@/composables/use-gsap";
import { routes } from "@/router/routes";
import type { ThemeMode } from "@/stores/theme";
import { useThemeStore } from "@/stores/theme";

const sidebarRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const themeStore = useThemeStore();
const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const menuPopoverStyle = ref<Record<string, string>>({});
const viewportWidth = ref(typeof window === "undefined" ? 1280 : window.innerWidth);
const settingsIcon = iconRegistry["solar:settings-minimalistic-outline"];
const musicIcon = iconRegistry["solar:music-notes-outline"];
const monitorIcon = iconRegistry["solar:monitor-outline"];
const sunIcon = iconRegistry["solar:sun-outline"];

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
const menuPlacement = computed(() => (viewportWidth.value <= 960 ? "bottom" : "right"));

const navItems = computed(() => {
  return routes
    .filter(route => route.meta?.showInSidebar)
    .map((route) => {
      const label = typeof route.meta?.title === "string" ? route.meta.title : "";
      const routeName = String(route.name ?? "");
      const icon = routeName === "discover"
        ? "solar:music-notes-outline"
        : routeName === "liked"
          ? "solar:heart-outline"
          : "solar:user-outline";
      return {
        to: String(route.path),
        label,
        icon,
      };
    });
});

useGsapReveal(sidebarRef, [".brand", ".app-sidebar__meta-pill", ".nav-link"], 0.08);

function onSelectPreset(presetId: string) {
  themeStore.setPreset(presetId);
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function updateMenuPopoverLayout() {
  if (!menuOpen.value || !sidebarRef.value || !triggerRef.value || typeof window === "undefined") {
    return;
  }

  if (menuPlacement.value === "bottom") {
    menuPopoverStyle.value = {};
    return;
  }

  const sidebarRect = sidebarRef.value.getBoundingClientRect();
  const triggerRect = triggerRef.value.getBoundingClientRect();
  const edgeInset = 24;
  const availableHeight = Math.max(220, Math.floor(sidebarRect.height - edgeInset));
  const availableWidth = Math.max(280, Math.min(396, Math.floor(window.innerWidth - triggerRect.right - 24)));

  menuPopoverStyle.value = {
    width: `${availableWidth}px`,
    maxWidth: `${availableWidth}px`,
    maxHeight: `${availableHeight}px`,
    overflowY: "auto",
  };
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

function handleResize() {
  viewportWidth.value = window.innerWidth;
  updateMenuPopoverLayout();
}

watch(menuOpen, async (open) => {
  if (!open) {
    menuPopoverStyle.value = {};
    return;
  }

  await nextTick();
  updateMenuPopoverLayout();
});

onMounted(() => {
  window.addEventListener("mousedown", handlePointerDown);
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousedown", handlePointerDown);
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <aside ref="sidebarRef" class="app-sidebar">
    <UiSectionCard class="app-sidebar__panel" compact>
      <div class="brand">
        <span class="brand__badge">
          <UiIconButton
            class="brand__logo"
            icon="solar:music-notes-outline"
            label="My Player"
            variant="solid"
            size="lg"
          />
        </span>
        <div class="brand__copy">
          <strong class="brand__title">My Player</strong>
          <span class="brand__subtitle">Music desktop</span>
        </div>
      </div>

      <div class="app-sidebar__meta" aria-label="导航摘要">
        <span class="app-sidebar__meta-pill">
          <UiIconButton icon="solar:music-notes-outline" label="内容" variant="ghost" size="sm" />
          <span>内容</span>
        </span>
        <span class="app-sidebar__meta-pill">
          <UiIconButton icon="solar:heart-outline" label="喜欢" variant="ghost" size="sm" />
          <span>喜欢</span>
        </span>
        <span class="app-sidebar__meta-pill">
          <UiIconButton icon="solar:user-outline" label="我的" variant="ghost" size="sm" />
          <span>我的</span>
        </span>
      </div>

      <ul class="nav-list">
        <li v-for="item in navItems" :key="item.to">
          <RouterLink :to="item.to" class="nav-link" exact-active-class="is-active">
            <UiIconButton
              class="nav-link__icon"
              :icon="item.icon"
              :label="item.label"
              variant="ghost"
              size="sm"
            />
            {{ item.label }}
          </RouterLink>
        </li>
      </ul>

      <div ref="menuRef" class="app-sidebar__menu-anchor">
        <div ref="triggerRef" class="app-sidebar__menu-trigger">
          <UiIconButton
            icon="solar:settings-minimalistic-outline"
            label="打开外观菜单"
            size="sm"
            variant="soft"
            :pressed="menuOpen"
            data-testid="sidebar-menu-trigger"
            @click="toggleMenu"
          />
        </div>
        <transition
          :css="false"
          @enter="animatePopoverEnter"
          @leave="animatePopoverLeave"
        >
          <div
            v-if="menuOpen"
            class="menu-popover"
            data-testid="sidebar-theme-controls"
            :data-placement="menuPlacement"
            :style="menuPopoverStyle"
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
              <div class="theme-controls__group" data-testid="sidebar-theme-toggle">
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
    </UiSectionCard>
  </aside>
</template>

<style scoped lang="less">
.app-sidebar {
  height: 100%;
}

.app-sidebar__panel {
  position: relative;
  height: 100%;
  min-height: 100%;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  border-radius: var(--radius-lg);
  overflow: visible;
}

.app-sidebar__panel :deep(.ui-section-card__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 2px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 18px;
  background:
    linear-gradient(180deg, var(--color-control-surface-strong), var(--color-control-surface)),
    var(--color-panel-fill);
}

.brand__badge {
  display: inline-flex;
  padding: 4px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
}

.brand__logo {
  flex-shrink: 0;
}

.brand__copy {
  display: grid;
  gap: 3px;
}

.brand__title {
  font-size: 16px;
  color: var(--color-text-strong);
}

.brand__subtitle {
  font-size: 11px;
  color: var(--color-text-tertiary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.app-sidebar__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.app-sidebar__meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px 4px 4px;
  border: 1px solid var(--color-state-border-subtle);
  border-radius: 999px;
  background: var(--color-control-surface);
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: var(--space-1) 0 0;
  display: grid;
  gap: 6px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  border-radius: var(--radius-sm);
  padding: 9px 10px;
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: 600;
  transition:
    background-color 180ms ease,
    color 180ms ease,
    border-color 180ms ease,
    transform 180ms ease;
  border: 1px solid rgba(255, 255, 255, 0.001);
}

.nav-link:hover {
  transform: translateX(2px);
  color: var(--color-text);
  border-color: var(--color-state-border-subtle);
  background: var(--color-state-hover);
}

.nav-link.is-active {
  color: var(--color-text-strong);
  border-color: var(--color-state-border-emphasis);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent),
    var(--color-state-accent-soft);
  box-shadow: inset 0 1px 0 var(--color-control-stroke);
}

.app-sidebar__menu-anchor {
  position: absolute;
  right: var(--space-4);
  bottom: var(--space-4);
  display: flex;
  justify-content: flex-end;
  z-index: 35;
}

.app-sidebar__menu-trigger {
  display: inline-flex;
}

.menu-popover {
  position: absolute;
  min-width: 336px;
  max-width: min(396px, calc(100vw - 40px));
  overflow-x: hidden;
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
  z-index: 30;
  overscroll-behavior: contain;
}

.menu-popover[data-placement="right"] {
  left: calc(100% + 12px);
  right: auto;
  bottom: 0;
  top: auto;
}

.menu-popover[data-placement="bottom"] {
  left: 0;
  right: auto;
  top: calc(100% + 8px);
  bottom: auto;
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

.nav-link__icon {
  pointer-events: none;
  color: currentColor;
  background: color-mix(in srgb, currentColor 8%, transparent);
  border-radius: 999px;
}

@media (max-width: 960px) {
  .app-sidebar__panel {
    min-height: 0;
    padding: var(--space-3);
    gap: var(--space-3);
  }

  .nav-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding-top: 0;
  }

  .nav-link {
    justify-content: center;
  }

  .nav-link__icon {
    display: none;
  }

  .app-sidebar__menu-anchor {
    position: relative;
    right: auto;
    bottom: auto;
    margin-top: var(--space-3);
    justify-content: flex-start;
  }

  .menu-popover {
    min-width: min(336px, calc(100vw - 24px));
    max-width: min(336px, calc(100vw - 24px));
  }
}
</style>
