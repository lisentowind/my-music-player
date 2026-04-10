<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { gsap } from "gsap";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import UiThemePalette from "@/components/ui/UiThemePalette.vue";
import UiThemeToggle from "@/components/ui/UiThemeToggle.vue";
import { iconRegistry } from "@/components/ui/icon-registry";
import { useThemeStore } from "@/stores/theme";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const dialogRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const theme = useThemeStore();

const currentColorLabel = computed(() => theme.activePreset?.name ?? "自由定制");

function closeDialog() {
  emit("update:open", false);
}

function onOverlayClick(event: MouseEvent) {
  if (event.target === dialogRef.value) {
    closeDialog();
  }
}

function onCustomColorChange(nextColor: string) {
  theme.setCustomColor(nextColor);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && props.open) {
    closeDialog();
  }
}

watch(() => props.open, async (isOpen) => {
  if (typeof window === "undefined") {
    return;
  }

  if (isOpen) {
    window.addEventListener("keydown", handleKeydown);
    await nextTick();
    if (dialogRef.value && panelRef.value) {
      gsap.fromTo(
        dialogRef.value,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.18, ease: "power2.out" },
      );
      gsap.fromTo(
        panelRef.value,
        { autoAlpha: 0, y: -14, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: "power3.out" },
      );
    }
    return;
  }

  window.removeEventListener("keydown", handleKeydown);
}, { immediate: true });

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeydown);
  }
});
</script>

<template>
  <div
    v-if="props.open"
    ref="dialogRef"
    class="app-settings-dialog"
    data-testid="settings-dialog"
    open
    role="dialog"
    aria-modal="true"
    aria-label="外观设置"
    @click="onOverlayClick"
  >
    <section ref="panelRef" class="app-settings-dialog__panel">
      <header class="app-settings-dialog__header">
        <div class="app-settings-dialog__title-wrap">
          <span class="app-settings-dialog__eyebrow">偏好设置</span>
          <h2 class="app-settings-dialog__title">外观设置</h2>
          <p class="app-settings-dialog__subtitle">亮暗主题、主题色和全局界面氛围都会同步切换。</p>
        </div>

        <button
          type="button"
          class="app-settings-dialog__close"
          aria-label="关闭设置"
          @click="closeDialog"
        >
          <Icon :icon="iconRegistry['solar:settings-minimalistic-outline']" />
        </button>
      </header>

      <section class="app-settings-dialog__section">
        <div class="app-settings-dialog__section-head">
          <span>显示模式</span>
          <small>当前生效：{{ theme.resolvedMode === "dark" ? "深色" : "浅色" }}</small>
        </div>
        <UiThemeToggle
          :model-value="theme.mode"
          :resolved-mode="theme.resolvedMode"
          @update:model-value="theme.setMode"
        />
      </section>

      <section class="app-settings-dialog__section">
        <div class="app-settings-dialog__section-head">
          <span>主题色</span>
          <small>{{ currentColorLabel }}</small>
        </div>
        <UiThemePalette
          :presets="theme.presets"
          :active-preset-id="theme.activePresetId"
          :model-value="theme.themeColor"
          @select-preset="theme.setPreset"
          @update:model-value="onCustomColorChange"
        />
      </section>

      <section class="app-settings-dialog__preview">
        <div class="app-settings-dialog__preview-card">
          <span class="app-settings-dialog__preview-label">界面预览</span>
          <strong class="app-settings-dialog__preview-title">胶囊 Dock · 玻璃面板 · 中文排版</strong>
          <p class="app-settings-dialog__preview-copy">主题色会自动针对浅色和深色模式生成更合适的按钮、阴影、背景辉光和文字对比。</p>
          <div class="app-settings-dialog__preview-swatches">
            <span class="app-settings-dialog__preview-swatch app-settings-dialog__preview-swatch--accent" />
            <span class="app-settings-dialog__preview-swatch app-settings-dialog__preview-swatch--surface" />
            <span class="app-settings-dialog__preview-swatch app-settings-dialog__preview-swatch--text" />
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<style scoped lang="less">
.app-settings-dialog {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  justify-items: end;
  align-items: start;
  padding: calc(var(--layout-gap) + 54px) var(--layout-gap) var(--layout-gap);
  background: var(--color-overlay-scrim);
  backdrop-filter: blur(16px);
}

.app-settings-dialog__panel {
  width: min(420px, calc(100vw - (var(--layout-gap) * 2)));
  display: grid;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--color-panel-border);
  border-radius: 24px;
  background:
    linear-gradient(180deg, var(--color-popover-glow-start), transparent 36%),
    var(--color-popover-fill);
  box-shadow:
    0 28px 56px var(--color-popover-shadow),
    inset 0 1px 0 var(--color-popover-glow-end);
}

.app-settings-dialog__header,
.app-settings-dialog__section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.app-settings-dialog__title-wrap {
  min-width: 0;
}

.app-settings-dialog__eyebrow {
  display: inline-flex;
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.app-settings-dialog__title {
  margin: 6px 0 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: 24px;
  letter-spacing: -0.05em;
}

.app-settings-dialog__subtitle {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.app-settings-dialog__close {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-control-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease;
}

.app-settings-dialog__close:hover {
  transform: translateY(-1px);
  border-color: var(--color-state-border-emphasis);
  background: var(--color-control-surface-strong);
  color: var(--color-text-strong);
}

.app-settings-dialog__close :deep(svg) {
  width: 18px;
  height: 18px;
}

.app-settings-dialog__section,
.app-settings-dialog__preview-card {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--color-panel-border);
  border-radius: 18px;
  background:
    linear-gradient(180deg, var(--color-panel-glow-start), transparent 42%),
    var(--color-panel-fill);
}

.app-settings-dialog__section-head > span,
.app-settings-dialog__preview-title {
  color: var(--color-text-strong);
  font-size: 13px;
  font-weight: 700;
}

.app-settings-dialog__section-head > small,
.app-settings-dialog__preview-label {
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.app-settings-dialog__preview-copy {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.65;
}

.app-settings-dialog__preview-swatches {
  display: flex;
  gap: 8px;
}

.app-settings-dialog__preview-swatch {
  width: 52px;
  height: 12px;
  border-radius: 999px;
}

.app-settings-dialog__preview-swatch--accent {
  background: var(--gradient-primary);
}

.app-settings-dialog__preview-swatch--surface {
  background: var(--color-card-surface-soft);
}

.app-settings-dialog__preview-swatch--text {
  background: linear-gradient(90deg, var(--color-text-strong) 0%, var(--color-text-secondary) 100%);
}
</style>
