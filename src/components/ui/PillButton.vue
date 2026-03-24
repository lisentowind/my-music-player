<script setup lang="ts">
import { Icon } from "@iconify/vue";

withDefaults(defineProps<{
  label: string;
  icon?: string;
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
    class="pill-button"
    type="button"
    :aria-pressed="pressed"
    :aria-checked="checked"
    :role="role"
    :data-active="active ? 'true' : 'false'"
  >
    <Icon v-if="icon" :icon="icon" width="16" height="16" />
    <span>{{ label }}</span>
  </button>
</template>
