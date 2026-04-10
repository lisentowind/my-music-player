<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, ref, useAttrs } from "vue";
import { iconRegistry } from "@/components/ui/icon-registry";

defineOptions({
  inheritAttrs: false,
});

interface UiSearchFieldProps {
  modelValue?: string;
  inputId?: string;
  placeholder?: string;
  ariaLabel?: string;
  size?: "regular" | "compact";
}

const props = withDefaults(defineProps<UiSearchFieldProps>(), {
  modelValue: "",
  inputId: "",
  placeholder: "搜索歌曲、歌单、标签或艺人",
  ariaLabel: "搜索输入框",
  size: "regular",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const attrs = useAttrs();
const inputRef = ref<HTMLInputElement | null>(null);
const rootClass = computed(() => attrs.class);
const rootStyle = computed(() => attrs.style);
const inputAttrs = computed(() => Object.fromEntries(
  Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style"),
));

function onInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}

function focus() {
  inputRef.value?.focus();
}

function select() {
  inputRef.value?.select();
}

defineExpose({
  focus,
  select,
  inputElement: inputRef,
});
</script>

<template>
  <label
    class="ui-search-field"
    :class="[rootClass, `ui-search-field--${props.size}`]"
    :style="rootStyle"
  >
    <span class="ui-search-field__icon" aria-hidden="true">
      <Icon :icon="iconRegistry['solar:minimalistic-magnifer-outline']" />
    </span>
    <input
      :id="props.inputId"
      ref="inputRef"
      class="ui-search-field__input"
      type="search"
      autocomplete="off"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :aria-label="props.ariaLabel"
      v-bind="inputAttrs"
      @input="onInput"
    >
  </label>
</template>

<style scoped lang="less">
.ui-search-field {
  --ui-search-field-height: 50px;
  --ui-search-field-gap: 10px;
  --ui-search-field-padding-inline: 16px;
  --ui-search-field-font-size: 12px;
  --ui-search-field-icon-size: 18px;
  width: 100%;
  min-height: var(--ui-search-field-height);
  display: inline-flex;
  align-items: center;
  gap: var(--ui-search-field-gap);
  padding: 0 var(--ui-search-field-padding-inline);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-panel-glow-start) 78%, transparent), transparent 100%),
    var(--color-control-surface);
  box-shadow:
    inset 0 1px 0 var(--color-panel-glow-end),
    inset 0 0 0 1px color-mix(in srgb, var(--color-panel-glow-start) 18%, transparent);
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.ui-search-field:hover,
.ui-search-field:focus-within {
  border-color: var(--color-state-border-emphasis);
  background: var(--color-control-surface-strong);
  box-shadow:
    var(--shadow-sm),
    inset 0 1px 0 var(--color-panel-glow-end),
    inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 12%, transparent);
}

.ui-search-field__icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
}

.ui-search-field__icon :deep(svg) {
  width: var(--ui-search-field-icon-size);
  height: var(--ui-search-field-icon-size);
}

.ui-search-field__input {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: var(--ui-search-field-font-size);
  line-height: 1.2;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  box-shadow: none;
  font: inherit;
}

.ui-search-field__input::placeholder {
  color: var(--color-text-tertiary);
}

.ui-search-field__input::-webkit-search-decoration,
.ui-search-field__input::-webkit-search-cancel-button,
.ui-search-field__input::-webkit-search-results-button,
.ui-search-field__input::-webkit-search-results-decoration {
  -webkit-appearance: none;
  appearance: none;
  display: none;
}

.ui-search-field--compact {
  --ui-search-field-height: 40px;
  --ui-search-field-gap: 8px;
  --ui-search-field-padding-inline: 13px;
  --ui-search-field-font-size: 11px;
  --ui-search-field-icon-size: 16px;
}
</style>
