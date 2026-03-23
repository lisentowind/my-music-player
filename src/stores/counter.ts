import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useCounterStore = defineStore("counter", () => {
  const count = ref(0);
  const doubleCount = computed(() => count.value * 2);

  function increment(step = 1) {
    count.value += step;
  }

  function reset() {
    count.value = 0;
  }

  return {
    count,
    doubleCount,
    increment,
    reset,
  };
});
