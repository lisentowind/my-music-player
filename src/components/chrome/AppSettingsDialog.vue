<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { gsap } from "gsap";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { MOTION_TOKENS } from "@/composables/use-gsap";
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
        { autoAlpha: 1, duration: 0.2, ease: MOTION_TOKENS.popover.enter.ease },
      );
      gsap.fromTo(
        panelRef.value,
        { autoAlpha: 0, y: -10, scale: 0.976, filter: "blur(10px)" },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: MOTION_TOKENS.popover.enter.duration,
          ease: MOTION_TOKENS.popover.enter.ease,
          clearProps: "opacity,visibility,transform,filter",
        },
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
}

.app-settings-dialog__panel {
  width: min(398px, calc(100vw - (var(--layout-gap) * 2)));
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--color-panel-border);
  border-radius: 22px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-popover-glow-start) 86%, transparent), transparent 34%),
    color-mix(in srgb, var(--color-popover-fill) 96%, transparent);
  box-shadow:
    0 22px 46px var(--color-popover-shadow),
    inset 0 1px 0 var(--color-popover-glow-end);
  backdrop-filter: blur(22px) saturate(1.04);
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
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.app-settings-dialog__title {
  margin: 5px 0 0;
  color: var(--color-text-strong);
  font-family: "Plus Jakarta Sans", "Inter", sans-serif;
  font-size: 21px;
  font-weight: 760;
  letter-spacing: -0.05em;
}

.app-settings-dialog__subtitle {
  margin: 5px 0 0;
  color: var(--color-text-secondary);
  font-size: 11px;
  line-height: 1.55;
}

.app-settings-dialog__close {
  width: 34px;
  height: 34px;
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

.app-settings-dialog__section {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--color-panel-border);
  border-radius: 16px;
  background:
    linear-gradient(180deg, var(--color-panel-glow-start), transparent 42%),
    var(--color-panel-fill);
}

.app-settings-dialog__section-head > span {
  color: var(--color-text-strong);
  font-size: 12px;
  font-weight: 680;
}

.app-settings-dialog__section-head > small {
  color: var(--color-text-tertiary);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
</style>
