<script setup lang="ts">
import UiIconButton from "@/components/ui/UiIconButton.vue";
import type { ResolvedThemeMode, ThemeMode } from "@/stores/theme";

const props = defineProps<{
  modelValue: ThemeMode;
  resolvedMode: ResolvedThemeMode;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ThemeMode];
}>();

const modeOptions: Array<{ value: ThemeMode; label: string; icon: string; testId: string }> = [
  { value: "light", label: "浅色", icon: "solar:sun-outline", testId: "theme-mode-light" },
  { value: "dark", label: "深色", icon: "solar:moon-outline", testId: "theme-mode-dark" },
  { value: "system", label: "跟随系统", icon: "solar:monitor-outline", testId: "theme-mode-system" },
];

function setMode(nextMode: ThemeMode) {
  emit("update:modelValue", nextMode);
}
</script>

<template>
  <div class="ui-theme-toggle" role="group" aria-label="主题模式切换">
    <UiIconButton
      v-for="option in modeOptions"
      :key="option.value"
      class="ui-theme-toggle__button"
      :icon="option.icon"
      :label="option.label"
      variant="ghost"
      size="sm"
      :pressed="props.modelValue === option.value"
      :data-testid="option.testId"
      @click="setMode(option.value)"
    />
    <span class="ui-theme-toggle__resolved" data-testid="theme-resolved-mode">
      {{ props.resolvedMode === "dark" ? "深色" : "浅色" }}
    </span>
  </div>
</template>

<style scoped lang="less">
.ui-theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ui-theme-toggle__button {
  flex-shrink: 0;
}

.ui-theme-toggle__resolved {
  color: var(--color-text-tertiary);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
