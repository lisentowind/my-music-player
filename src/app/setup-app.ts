import type { App as VueApp } from "vue";
import { createPinia } from "pinia";
import { router } from "@/router";
import { useAppearanceStore } from "@/stores/appearance";
import "virtual:uno.css";
import "@/styles/index.less";

export function setupApp(app: VueApp<Element>) {
  const pinia = createPinia();

  app.use(pinia);

  const appearance = useAppearanceStore();
  appearance.hydrate();
  appearance.apply();

  app.use(router);
}
