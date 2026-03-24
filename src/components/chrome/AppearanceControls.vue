<script setup lang="ts">
import { computed, ref } from "vue";
import IconButton from "@/components/ui/IconButton.vue";
import PillButton from "@/components/ui/PillButton.vue";
import { themePresets } from "@/lib/theme/presets";
import type { AppearanceMode, ThemePresetId } from "@/lib/theme/presets";
import { useAppearanceStore } from "@/stores/appearance";

const appearance = useAppearanceStore();
const customAccentInput = ref<HTMLInputElement>();
const supportsColorInput = isColorInputSupported();

const hasCustomAccent = computed(() => appearance.customAccent.length > 0);

function isColorInputSupported() {
  if (typeof document === "undefined") {
    return false;
  }

  const input = document.createElement("input");
  input.setAttribute("type", "color");
  return input.type === "color";
}

function selectMode(mode: AppearanceMode) {
  appearance.setMode(mode);
}

function selectPreset(presetId: ThemePresetId) {
  appearance.setPreset(presetId);
}

function openCustomAccentPicker() {
  if (!supportsColorInput) {
    return;
  }

  customAccentInput.value?.click();
}

function updateCustomAccent(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  if (!value) {
    return;
  }

  appearance.setCustomAccent(value);
}
</script>

<template>
  <section class="appearance-controls app-scroll-area" aria-label="外观控制">
    <div class="appearance-controls__row">
      <span class="appearance-controls__label">模式</span>
      <div class="segmented-button" role="group" aria-label="主题模式">
        <IconButton
          label="跟随系统"
          icon="solar:monitor-outline"
          :active="appearance.mode === 'system'"
          :pressed="appearance.mode === 'system'"
          data-testid="theme-mode-system"
          @click="selectMode('system')"
        />
        <IconButton
          label="浅色"
          icon="solar:sun-2-outline"
          :active="appearance.mode === 'light'"
          :pressed="appearance.mode === 'light'"
          data-testid="theme-mode-light"
          @click="selectMode('light')"
        />
        <IconButton
          label="深色"
          icon="solar:moon-outline"
          :active="appearance.mode === 'dark'"
          :pressed="appearance.mode === 'dark'"
          data-testid="theme-mode-dark"
          @click="selectMode('dark')"
        />
      </div>
    </div>

    <div class="appearance-controls__row">
      <span class="appearance-controls__label">主题色</span>
      <div class="appearance-controls__presets">
        <PillButton
          v-for="preset in themePresets"
          :key="preset.id"
          :label="preset.label"
          icon="solar:pallete-2-outline"
          :active="appearance.presetId === preset.id && !hasCustomAccent"
          :pressed="appearance.presetId === preset.id && !hasCustomAccent"
          :data-testid="`theme-preset-${preset.id}`"
          @click="selectPreset(preset.id)"
        />
        <PillButton
          v-if="supportsColorInput"
          label="自定义"
          icon="solar:pallete-outline"
          data-testid="theme-custom-accent"
          :active="hasCustomAccent"
          :pressed="hasCustomAccent"
          @click="openCustomAccentPicker"
        />
        <PillButton
          v-if="hasCustomAccent"
          label="清除"
          icon="solar:close-circle-outline"
          @click="appearance.clearCustomAccent()"
        />
      </div>
      <input
        v-if="supportsColorInput"
        ref="customAccentInput"
        class="appearance-controls__native-color"
        type="color"
        :value="appearance.resolvedAccent"
        @input="updateCustomAccent"
      >
    </div>
  </section>
</template>

<style scoped lang="less">
.appearance-controls {
  display: grid;
  gap: var(--space-3);
}

.appearance-controls__row {
  display: grid;
  gap: var(--space-2);
}

.appearance-controls__label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.appearance-controls__presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.appearance-controls__native-color {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
