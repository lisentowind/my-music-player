import { defineStore } from "pinia";
import { ref } from "vue";

export const useExploreStore = defineStore("explore", () => {
  const searchText = ref("");

  function setSearchText(value: string) {
    searchText.value = value;
  }

  function clearSearchText() {
    searchText.value = "";
  }

  return {
    searchText,
    setSearchText,
    clearSearchText,
  };
});
