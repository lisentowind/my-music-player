<script setup lang="ts">
import { computed, ref } from "vue";
import { useGsapHover } from "@/composables/use-gsap";

type UiButtonVariant = "soft" | "solid" | "ghost";
type UiButtonSize = "sm" | "md" | "lg";

const props = withDefaults(defineProps<{
  variant?: UiButtonVariant;
  size?: UiButtonSize;
  block?: boolean;
  active?: boolean;
  type?: "button" | "submit" | "reset";
}>(), {
  variant: "soft",
  size: "md",
  block: false,
  active: false,
  type: "button",
});

const className = computed(() => [
  "ui-button",
  `ui-button--${props.variant}`,
  `ui-button--${props.size}`,
  props.block ? "ui-button--block" : "",
  props.active ? "is-active" : "",
]);
const buttonRef = ref<HTMLElement | null>(null);

useGsapHover(buttonRef, {
  hoverY: props.variant === "ghost" ? -1 : -3,
  hoverScale: props.variant === "solid" ? 1.02 : 1.01,
});
</script>

<template>
  <button ref="buttonRef" :type="type" :class="className">
    <slot name="leading" />
    <span v-if="$slots.default" class="ui-button__label">
      <slot />
    </span>
    <slot name="trailing" />
  </button>
</template>

<style scoped lang="less">
.ui-button {
  --ui-button-height: 42px;
  --ui-button-padding-x: var(--space-4);
  --ui-button-bg: linear-gradient(180deg, var(--color-panel-glow-start), transparent 70%), var(--color-control-surface);
  --ui-button-border: var(--color-border);
  --ui-button-color: var(--color-text);
  --ui-button-shadow: 0 10px 24px var(--color-popover-shadow);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--ui-button-height);
  width: auto;
  padding: 0 var(--ui-button-padding-x);
  border: 1px solid var(--ui-button-border);
  border-radius: 999px;
  background: var(--ui-button-bg);
  color: var(--ui-button-color);
  box-shadow: var(--ui-button-shadow);
  cursor: pointer;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease,
    background 140ms ease,
    color 140ms ease;
}

.ui-button:hover {
  transform: translateY(-1px);
  border-color: var(--color-state-border-emphasis);
  box-shadow: 0 14px 28px var(--color-popover-shadow);
}

.ui-button:active {
  transform: translateY(1px);
}

.ui-button--sm {
  --ui-button-height: 34px;
  --ui-button-padding-x: 12px;
  font-size: 12px;
}

.ui-button--md {
  font-size: 13px;
}

.ui-button--lg {
  --ui-button-height: 48px;
  --ui-button-padding-x: 18px;
  font-size: 14px;
}

.ui-button--ghost {
  --ui-button-bg: transparent;
  --ui-button-border: transparent;
  --ui-button-shadow: none;
  color: var(--color-text-secondary);
}

.ui-button--ghost:hover {
  background: var(--color-state-hover);
  box-shadow: none;
}

.ui-button--soft {
  --ui-button-bg: linear-gradient(180deg, var(--color-panel-glow-start), transparent 70%), var(--color-surface-strong);
}

.ui-button--solid {
  --ui-button-bg: var(--gradient-primary);
  --ui-button-border: transparent;
  --ui-button-color: var(--color-on-accent);
  --ui-button-shadow: var(--shadow-primary-hover);
}

.ui-button--solid:hover {
  background: var(--gradient-primary-hover);
  box-shadow: var(--shadow-primary-hover);
}

.ui-button.is-active {
  --ui-button-border: color-mix(in srgb, var(--color-accent) 30%, transparent);
  --ui-button-bg: color-mix(in srgb, var(--color-accent) 16%, var(--color-surface-strong));
  --ui-button-color: var(--color-text-strong);
}

.ui-button--block {
  width: 100%;
}

.ui-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.ui-button__label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: inherit;
}
</style>
