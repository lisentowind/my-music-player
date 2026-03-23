import { invoke } from "@tauri-apps/api/core";

const TAURI_INTERNALS_KEY = "__TAURI_INTERNALS__";

export interface RuntimeSnapshot {
  runtimeLabel: string;
  routeName: string;
  routePath: string;
  userAgent: string;
}

export function isTauriRuntime() {
  return typeof window !== "undefined" && TAURI_INTERNALS_KEY in window;
}

export function getRuntimeSnapshot(routePath: string, routeName?: string | null): RuntimeSnapshot {
  const runtimeLabel = isTauriRuntime() ? "桌面端（Tauri）" : "浏览器（Web）";

  return {
    runtimeLabel,
    routeName: routeName ?? "unknown",
    routePath,
    userAgent: typeof navigator === "undefined" ? "unknown" : navigator.userAgent,
  };
}

export async function getGreeting(name: string) {
  const normalizedName = name.trim() || "Player";
  return invoke<string>("greet", { name: normalizedName });
}
