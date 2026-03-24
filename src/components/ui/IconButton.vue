<script setup lang="ts">
import { Icon } from "@iconify/vue";

defineProps<{
  label: string;
  icon: string;
  active?: boolean;
}>();
</script>

<template>
  <button class="icon-button" type="button" :aria-label="label" :data-active="active ? 'true' : 'false'">
    <Icon :icon="icon" width="18" height="18" />
  </button>
</template>
