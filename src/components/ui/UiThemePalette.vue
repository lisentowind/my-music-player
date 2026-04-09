<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed } from "vue";
import { iconRegistry } from "@/components/ui/icon-registry";
import type { ThemePreset } from "@/stores/theme";

const props = defineProps<{
  presets: ThemePreset[];
  activePresetId: string;
  modelValue: string;
}>();

const emit = defineEmits<{
  selectPreset: [presetId: string];
  "update:modelValue": [value: string];
}>();

function onSelectPreset(presetId: string) {
  emit("selectPreset", presetId);
}

function onCustomColorInput(event: Event) {
  const nextColor = (event.target as HTMLInputElement).value;
  emit("update:modelValue", nextColor);
}

const settingsIcon = iconRegistry["solar:settings-minimalistic-outline"];
const musicIcon = iconRegistry["solar:music-notes-outline"];
const activePresetName = computed(() => props.presets.find(preset => preset.id === props.activePresetId)?.name || "自由");
</script>

<template>
  <div class="ui-theme-palette">
    <div class="ui-theme-palette__meta">
      <span class="ui-theme-palette__label">
        <Icon :icon="settingsIcon" />
        色板
      </span>
      <span class="ui-theme-palette__value">{{ activePresetName }}</span>
    </div>
    <div class="ui-theme-palette__presets">
      <button
        v-for="preset in props.presets"
        :key="preset.id"
        class="ui-theme-palette__swatch"
        :class="{ 'is-active': props.activePresetId === preset.id }"
        :aria-pressed="props.activePresetId === preset.id"
        :aria-label="`切换到${preset.name}主题色`"
        :title="preset.name"
        type="button"
        :data-testid="`theme-preset-${preset.id}`"
        @click="onSelectPreset(preset.id)"
      >
        <span class="ui-theme-palette__swatch-core" :style="{ backgroundColor: preset.color }" />
        <span class="ui-theme-palette__swatch-name">{{ preset.name }}</span>
      </button>
    </div>
    <label class="ui-theme-palette__custom">
      <span class="ui-theme-palette__custom-meta">
        <span class="ui-theme-palette__custom-icon" aria-hidden="true">
          <Icon :icon="musicIcon" />
        </span>
        <span class="ui-theme-palette__custom-label">自由色</span>
      </span>
      <span class="ui-theme-palette__custom-value">{{ props.modelValue }}</span>
      <input
        data-testid="theme-custom-color"
        type="color"
        :value="props.modelValue"
        aria-label="自定义主题色"
        @input="onCustomColorInput"
      >
    </label>
  </div>
</template>

<style scoped lang="less">
.ui-theme-palette {
  width: 100%;
  display: grid;
  gap: 10px;
}

.ui-theme-palette__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ui-theme-palette__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ui-theme-palette__label :deep(svg) {
  width: 14px;
  height: 14px;
  color: var(--color-accent);
}

.ui-theme-palette__value {
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.ui-theme-palette__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ui-theme-palette__swatch {
  min-width: 70px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 8px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 10%, var(--color-border));
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), transparent 54%),
    color-mix(in srgb, var(--color-control-surface) 96%, rgba(255, 255, 255, 0.1));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 8px 18px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
}

.ui-theme-palette__swatch:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-accent) 32%, var(--color-border));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 12px 22px rgba(15, 23, 42, 0.12);
}

.ui-theme-palette__swatch-core {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.3);
}

.ui-theme-palette__swatch-name {
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 600;
}

.ui-theme-palette__swatch.is-active {
  border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 16%, rgba(255, 255, 255, 0.18)), transparent 64%),
    color-mix(in srgb, var(--color-control-surface) 90%, rgba(255, 255, 255, 0.1));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 0 0 1px color-mix(in srgb, var(--color-accent) 24%, transparent),
    0 14px 24px rgba(15, 23, 42, 0.12);
}

.ui-theme-palette__custom {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 10%, var(--color-border));
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), transparent 54%),
    color-mix(in srgb, var(--color-control-surface) 96%, rgba(255, 255, 255, 0.1));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.ui-theme-palette__custom-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.ui-theme-palette__custom-icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 16%, transparent);
  color: var(--color-accent);
}

.ui-theme-palette__custom-icon :deep(svg) {
  width: 14px;
  height: 14px;
}

.ui-theme-palette__custom-label {
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 600;
}

.ui-theme-palette__custom-value {
  min-width: 0;
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-align: right;
  text-transform: uppercase;
}

.ui-theme-palette__custom input[type="color"] {
  width: 34px;
  height: 26px;
  border: 1px solid color-mix(in srgb, var(--color-accent) 16%, var(--color-border));
  border-radius: 10px;
  padding: 0;
  background: transparent;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.1);
  cursor: pointer;
}
</style>
