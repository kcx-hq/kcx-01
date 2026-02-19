export function getCachedCapabilities() {
  try {
    const raw = localStorage.getItem("capabilities");
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (parsed.version !== "v1") return null;
    if (Date.now() - parsed.cachedAt > 15 * 60 * 1000) return null;

    return parsed.value;
  } catch {
    return null;
  }
}
