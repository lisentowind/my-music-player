<script setup lang="ts">
import { computed, ref } from "vue";
import { Icon } from "@iconify/vue";
import { iconRegistry } from "@/components/ui/icon-registry";
import { useGsapHover } from "@/composables/use-gsap";

type UiIconButtonVariant = "soft" | "solid" | "ghost";
type UiIconButtonSize = "sm" | "md" | "lg";

const props = withDefaults(defineProps<{
  icon?: string;
  label: string;
  variant?: UiIconButtonVariant;
  size?: UiIconButtonSize;
  pressed?: boolean;
  type?: "button" | "submit" | "reset";
}>(), {
  icon: "",
  variant: "soft",
  size: "md",
  pressed: false,
  type: "button",
});

const className = computed(() => [
  "ui-icon-button",
  `ui-icon-button--${props.variant}`,
  `ui-icon-button--${props.size}`,
  props.pressed ? "is-pressed" : "",
]);
const buttonRef = ref<HTMLElement | null>(null);

const resolvedIcon = computed(() => {
  if (!props.icon) {
    return null;
  }

  return iconRegistry[props.icon] ?? null;
});

useGsapHover(buttonRef, {
  hoverY: props.variant === "ghost" ? -1 : -3,
  hoverScale: props.variant === "solid" ? 1.03 : 1.015,
});
</script>

<template>
  <button
    ref="buttonRef"
    :type="type"
    :class="className"
    :aria-label="label"
    :aria-pressed="pressed ? 'true' : undefined"
  >
    <slot>
      <span class="ui-icon-button__icon" :data-icon="icon" aria-hidden="true">
        <Icon v-if="resolvedIcon" :icon="resolvedIcon" />
        <span v-else class="ui-icon-button__fallback" />
      </span>
    </slot>
  </button>
</template>

<style scoped lang="less">
.ui-icon-button {
  --ui-icon-button-size: 40px;
  --ui-icon-size: 18px;
  --ui-icon-button-bg: linear-gradient(180deg, var(--color-panel-glow-start), transparent 70%), var(--color-control-surface);
  --ui-icon-button-border: var(--color-border);
  --ui-icon-button-color: var(--color-text);
  --ui-icon-button-shadow: 0 10px 20px var(--color-popover-shadow);
  width: var(--ui-icon-button-size);
  height: var(--ui-icon-button-size);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ui-icon-button-border);
  border-radius: 999px;
  background: var(--ui-icon-button-bg);
  color: var(--ui-icon-button-color);
  box-shadow: var(--ui-icon-button-shadow);
  cursor: pointer;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease,
    background 140ms ease,
    color 140ms ease;
}

.ui-icon-button:hover {
  transform: translateY(-1px);
  border-color: var(--color-state-border-emphasis);
  box-shadow: 0 14px 26px var(--color-popover-shadow);
}

.ui-icon-button:active {
  transform: translateY(1px);
}

.ui-icon-button--sm {
  --ui-icon-button-size: 34px;
  --ui-icon-size: 16px;
}

.ui-icon-button--md {
  --ui-icon-button-size: 40px;
  --ui-icon-size: 18px;
}

.ui-icon-button--lg {
  --ui-icon-button-size: 52px;
  --ui-icon-size: 22px;
}

.ui-icon-button--ghost {
  --ui-icon-button-bg: transparent;
  --ui-icon-button-border: transparent;
  --ui-icon-button-shadow: none;
  --ui-icon-button-color: var(--color-text-secondary);
}

.ui-icon-button--ghost:hover {
  background: var(--color-state-hover);
  box-shadow: none;
}

.ui-icon-button--solid {
  --ui-icon-button-bg: var(--gradient-primary);
  --ui-icon-button-border: transparent;
  --ui-icon-button-color: var(--color-on-accent);
  --ui-icon-button-shadow: var(--shadow-primary-hover);
}

.ui-icon-button.is-pressed {
  --ui-icon-button-border: color-mix(in srgb, var(--color-accent) 34%, transparent);
  --ui-icon-button-bg: color-mix(in srgb, var(--color-accent) 16%, var(--color-surface-strong));
  --ui-icon-button-color: var(--color-accent-pressed);
}

.ui-icon-button__icon {
  width: var(--ui-icon-size);
  height: var(--ui-icon-size);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ui-icon-button__icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.ui-icon-button__fallback {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
}
</style>
