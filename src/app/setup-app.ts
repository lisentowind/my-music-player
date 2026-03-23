import type { App as VueApp } from "vue";
import { createPinia } from "pinia";
import { router } from "@/router";
import "virtual:uno.css";
import "@/styles/index.less";

export function setupApp(app: VueApp<Element>) {
  const pinia = createPinia();

  app.use(pinia);
  app.use(router);
}
