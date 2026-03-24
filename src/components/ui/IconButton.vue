<script setup lang="ts">
import { Icon } from "@iconify/vue";

withDefaults(defineProps<{
  label: string;
  icon: string;
  active?: boolean;
  pressed?: boolean;
  checked?: boolean;
  role?: string;
}>(), {
  active: false,
});
</script>

<template>
  <button
    class="icon-button"
    type="button"
    :aria-label="label"
    :aria-pressed="pressed"
    :aria-checked="checked"
    :role="role"
    :data-active="active ? 'true' : 'false'"
  >
    <Icon :icon="icon" width="18" height="18" />
  </button>
</template>
