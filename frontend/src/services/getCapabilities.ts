import { isCapabilities } from "./apiClient";

export function getCachedCapabilities() {
  try {
    const raw = localStorage.getItem("capabilities");
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      version?: unknown;
      cachedAt?: unknown;
      value?: unknown;
    };

    if (parsed.version !== "v1") return null;
    if (typeof parsed.cachedAt !== "number") return null;
    if (Date.now() - parsed.cachedAt > 15 * 60 * 1000) return null;
    if (!isCapabilities(parsed.value)) return null;

    return parsed.value;
  } catch {
    return null;
  }
}
