import { invoke, isTauri } from "@tauri-apps/api/core";

export const TAURI_UNAVAILABLE_MESSAGE = "当前为 Web 运行态，原生命令仅在 Tauri 桌面端可用。";

export interface RuntimeSnapshot {
  runtimeLabel: string;
  routeName: string;
  routePath: string;
  userAgent: string;
}

export function isTauriRuntime() {
  return isTauri();
}

export function getRuntimeSnapshot(routePath: string, routeName?: string | null): RuntimeSnapshot {
  const runtimeLabel = isTauriRuntime() ? "桌面端（Tauri）" : "浏览器（Web）";

  return {
    runtimeLabel,
    routeName: routeName ?? "未命名页面",
    routePath,
    userAgent: typeof navigator === "undefined" ? "不可用" : navigator.userAgent,
  };
}

export async function getGreeting(name: string) {
  if (!isTauriRuntime()) {
    throw new Error(TAURI_UNAVAILABLE_MESSAGE);
  }

  const normalizedName = name.trim() || "听众";
  return invoke<string>("greet", { name: normalizedName });
}
