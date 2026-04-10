<script setup lang="ts">
import { ref } from "vue";
import { getGreeting, isTauriRuntime, TAURI_UNAVAILABLE_MESSAGE } from "@/lib/tauri";

const name = ref("");
const result = ref("");
const error = ref("");
const loading = ref(false);
const tauriAvailable = isTauriRuntime();

async function submitGreeting() {
  if (!tauriAvailable) {
    error.value = TAURI_UNAVAILABLE_MESSAGE;
    result.value = "";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    result.value = await getGreeting(name.value);
  } catch (exception) {
    error.value = exception instanceof Error ? exception.message : String(exception);
    result.value = "";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="card greet-panel">
    <h2 class="greet-panel__title">原生命令回环</h2>
    <p class="text-subtle greet-panel__subtitle">
      输入名称后调用 Rust 的问候命令，确认桌面端命令链路。
    </p>

    <p v-if="!tauriAvailable" class="greet-panel__hint">
      当前运行环境不是 Tauri，命令交互区已禁用。请使用 `pnpm tauri:dev` 在桌面端验证。
    </p>

    <label class="greet-panel__field">
      <span>名称</span>
      <input
        v-model="name"
        type="text"
        :disabled="!tauriAvailable"
        placeholder="例如：桌面听众"
      />
    </label>

    <button type="button" :disabled="loading || !tauriAvailable" @click="submitGreeting">
      {{ loading ? "调用中..." : "发送问候命令" }}
    </button>

    <p v-if="result" class="greet-panel__result">{{ result }}</p>
    <p v-else-if="error" class="greet-panel__error">{{ error }}</p>
  </section>
</template>

<style scoped lang="less">
.greet-panel {
  display: grid;
  gap: var(--space-4);
}

.greet-panel__title {
  margin: 0;
  font-size: 18px;
}

.greet-panel__subtitle {
  margin: 0;
  font-size: 14px;
}

.greet-panel__field {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.greet-panel__field input {
  width: 100%;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  padding: 10px 12px;
  background: var(--color-surface-strong);
  color: var(--color-text);
  outline: none;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.greet-panel__field input:disabled {
  background: var(--color-state-surface-muted);
  cursor: not-allowed;
}

.greet-panel__field input:focus {
  border-color: var(--color-state-border-emphasis);
  box-shadow: var(--focus-ring);
}

button {
  justify-self: start;
  border: 0;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-weight: 600;
  color: var(--color-on-accent);
  background: var(--gradient-primary);
  cursor: pointer;
  transition: opacity 180ms ease;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.greet-panel__result,
.greet-panel__error {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-family: "SF Mono", "Consolas", monospace;
  font-size: 13px;
  word-break: break-word;
}

.greet-panel__result {
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-strong));
  border: 1px solid color-mix(in srgb, var(--color-accent) 24%, var(--color-border));
}

.greet-panel__hint {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid color-mix(in srgb, var(--color-accent) 18%, var(--color-border));
  background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-strong));
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.greet-panel__error {
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 12%, var(--color-surface-strong));
  border: 1px solid color-mix(in srgb, var(--color-danger) 24%, var(--color-border));
}
</style>
