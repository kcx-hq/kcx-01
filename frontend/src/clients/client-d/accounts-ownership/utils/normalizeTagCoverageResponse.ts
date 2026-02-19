export function normalizeTagCoverageResponse(res) {
  const payload = res?.success && res?.data ? res.data : (res?.data ?? res ?? null);

  if (!payload) {
    return {
      taggedCost: 0,
      untaggedCost: 0,
      taggedPercent: 0,
      untaggedPercent: 0,
      missingTags: [],
    };
  }

  return {
    taggedCost: Number(payload.taggedCost ?? 0),
    untaggedCost: Number(payload.untaggedCost ?? 0),
    taggedPercent: Number(payload.taggedPercent ?? 0),
    untaggedPercent: Number(payload.untaggedPercent ?? 0),
    missingTags: Array.isArray(payload.missingTags) ? payload.missingTags : [],
  };
}
