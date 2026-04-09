#!/usr/bin/env node

import validationManifest from "../src/data/aura-resource-manifest.json" with { type: "json" };

const SKIP_ENV_KEY = "AURA_SKIP_RESOURCE_VALIDATION";
const DEFAULT_TIMEOUT_MS = 8000;
const MAX_TRANSIENT_RETRIES = 2;
const TRANSIENT_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * @typedef {Object} AuraResourceValidationItem
 * @property {string} resourceKey
 * @property {string} trackId
 * @property {"cover" | "audio"} kind
 * @property {string} primaryUrl
 * @property {string | null} fallbackUrl
 * @property {string} description
 */

function parseTimeoutMs() {
  const value = process.env.AURA_RESOURCE_TIMEOUT_MS;
  if (!value) {
    return DEFAULT_TIMEOUT_MS;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }
  return parsed;
}

function isLikelyNetworkUnavailable(error) {
  const source = String(error && typeof error === "object" && "cause" in error ? error.cause : error);
  const message = `${source} ${error instanceof Error ? error.message : ""}`;
  return /(ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ENETUNREACH|network|fetch failed)/iu.test(message);
}

function isLikelyTemporaryError(error) {
  return (
    (error instanceof Error && error.name === "AbortError")
    || isLikelyNetworkUnavailable(error)
  );
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function classifyHttpStatus(status) {
  return TRANSIENT_STATUS_CODES.has(status) ? "transient" : "replace";
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function probePrimaryUrlOnce(url, timeoutMs) {
  const headResponse = await fetchWithTimeout(url, { method: "HEAD", redirect: "follow" }, timeoutMs);
  if (headResponse.ok) {
    return { ok: true, detail: `HTTP ${headResponse.status}` };
  }

  if (![403, 405, 501].includes(headResponse.status)) {
    return {
      ok: false,
      category: classifyHttpStatus(headResponse.status),
      detail: `HTTP ${headResponse.status}`,
    };
  }

  const getResponse = await fetchWithTimeout(
    url,
    {
      method: "GET",
      redirect: "follow",
      headers: { Range: "bytes=0-0" },
    },
    timeoutMs,
  );
  if (getResponse.ok) {
    return { ok: true, detail: `GET HTTP ${getResponse.status}` };
  }
  return {
    ok: false,
    category: classifyHttpStatus(getResponse.status),
    detail: `GET HTTP ${getResponse.status}`,
  };
}

async function probePrimaryUrl(url, timeoutMs) {
  let attempt = 0;
  while (attempt <= MAX_TRANSIENT_RETRIES) {
    attempt += 1;
    try {
      const result = await probePrimaryUrlOnce(url, timeoutMs);
      if (result.ok) {
        return result;
      }

      if (result.category === "transient" && attempt <= MAX_TRANSIENT_RETRIES) {
        await sleep(300 * attempt);
        continue;
      }

      return {
        ...result,
        detail:
          result.category === "transient"
            ? `${result.detail}（重试 ${attempt - 1} 次后仍为临时不可用）`
            : result.detail,
      };
    } catch (error) {
      if (!isLikelyTemporaryError(error) || attempt > MAX_TRANSIENT_RETRIES) {
        throw error;
      }

      await sleep(300 * attempt);
    }
  }

  return {
    ok: false,
    category: "transient",
    detail: `请求多次失败（已重试 ${MAX_TRANSIENT_RETRIES} 次）`,
  };
}

function loadValidationManifest() {
  const manifest = validationManifest;
  if (!Array.isArray(manifest)) {
    throw new Error(
      "aura-resource-manifest.json 必须导出数组，供在线资源验收脚本直接消费。",
    );
  }

  return /** @type {AuraResourceValidationItem[]} */ (manifest);
}

async function main() {
  if (process.env[SKIP_ENV_KEY] === "1") {
    console.log(
      `[SKIP] 检测到 ${SKIP_ENV_KEY}=1，已跳过在线 mock 资源包可达性验收。`,
    );
    return;
  }

  const timeoutMs = parseTimeoutMs();
  const manifest = loadValidationManifest();

  if (manifest.length === 0) {
    console.log("[PASS] 资源清单为空，无需探测。");
    return;
  }

  /** @type {Array<{resourceKey: string; url: string; reason: string}>} */
  const replaceFailures = [];
  /** @type {Array<{resourceKey: string; url: string; reason: string}>} */
  const transientFailures = [];
  /** @type {Array<{resourceKey: string; url: string; reason: string}>} */
  const networkFailures = [];
  let networkUnavailableCount = 0;

  for (const resource of manifest) {
    try {
      const result = await probePrimaryUrl(resource.primaryUrl, timeoutMs);
      if (!result.ok) {
        if (result.category === "transient") {
          transientFailures.push({
            resourceKey: resource.resourceKey,
            url: resource.primaryUrl,
            reason: result.detail,
          });
        } else {
          replaceFailures.push({
            resourceKey: resource.resourceKey,
            url: resource.primaryUrl,
            reason: result.detail,
          });
        }
      }
    } catch (error) {
      const networkUnavailable = isLikelyNetworkUnavailable(error);
      if (networkUnavailable) {
        networkUnavailableCount += 1;
      }

      const reason = error instanceof Error ? error.message : String(error);
      if (isLikelyTemporaryError(error)) {
        transientFailures.push({
          resourceKey: resource.resourceKey,
          url: resource.primaryUrl,
          reason: networkUnavailable ? `网络不可用: ${reason}` : `临时错误: ${reason}`,
        });
      } else {
        networkFailures.push({
          resourceKey: resource.resourceKey,
          url: resource.primaryUrl,
          reason,
        });
      }
    }
  }

  if (
    replaceFailures.length === 0
    && transientFailures.length === 0
    && networkFailures.length === 0
  ) {
    console.log(
      `[PASS] 在线资源可达性验收通过，共检查 ${manifest.length} 个主资源（超时 ${timeoutMs}ms）。`,
    );
    return;
  }

  if (networkUnavailableCount > 0) {
    console.error(
      `[ERROR] 检测到网络异常（${networkUnavailableCount} 个请求疑似网络不可用）。请检查网络或代理配置。`,
    );
    console.error(`[HINT] 如需跳过，可设置 ${SKIP_ENV_KEY}=1。`);
  }

  if (networkFailures.length > 0) {
    console.error("[ERROR] 以下资源探测失败（非临时错误，请人工确认）：");
    for (const failedResource of networkFailures) {
      console.error(`- ${failedResource.resourceKey} -> ${failedResource.url} (${failedResource.reason})`);
    }
  }

  if (transientFailures.length > 0) {
    console.error("[RETRY] 以下资源暂时不可用（如 429/503），建议稍后重试：");
    for (const failedResource of transientFailures) {
      console.error(`- ${failedResource.resourceKey} -> ${failedResource.url} (${failedResource.reason})`);
    }
  }

  if (replaceFailures.length > 0) {
    console.error("[FAIL] 以下 resourceKey 的主资源 URL 需要替换：");
    for (const failedResource of replaceFailures) {
      console.error(`- ${failedResource.resourceKey} -> ${failedResource.url} (${failedResource.reason})`);
    }
  }

  process.exitCode = 1;
}

main().catch((error) => {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(`[ERROR] 资源验收脚本执行失败：${reason}`);
  process.exitCode = 1;
});
