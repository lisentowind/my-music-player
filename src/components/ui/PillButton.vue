<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{
  label: string;
  icon?: string;
  active?: boolean;
}>();
</script>

<template>
  <button class="pill-button" type="button" :data-active="active ? 'true' : 'false'">
    <Icon v-if="icon" :icon="icon" width="16" height="16" />
    <span>{{ label }}</span>
  </button>
</template>
