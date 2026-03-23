import { createApp } from "vue";
import App from "@/App.vue";
import { setupApp } from "@/app/setup-app";

const app = createApp(App);

setupApp(app);

app.mount("#app");
