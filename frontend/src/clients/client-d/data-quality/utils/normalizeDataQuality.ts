export const EMPTY_DQ_STATS = {
  score: 0,
  totalRows: 0,
  costAtRisk: 0,
  buckets: { untagged: [], missingMeta: [], anomalies: [], all: [] },
  tagDimensions: {},
  trendData: [],
  topOffenders: [],
};

export function normalizeDataQualityResponse(res) {
  const payload = res?.success && res?.data ? res.data : (res?.data ?? res ?? null);
  if (!payload) return EMPTY_DQ_STATS;

  return {
    score: Number(payload.score ?? 0),
    totalRows: Number(payload.totalRows ?? 0),
    costAtRisk: Number(payload.costAtRisk ?? 0),
    buckets: {
      untagged: Array.isArray(payload?.buckets?.untagged) ? payload.buckets.untagged : [],
      missingMeta: Array.isArray(payload?.buckets?.missingMeta) ? payload.buckets.missingMeta : [],
      anomalies: Array.isArray(payload?.buckets?.anomalies) ? payload.buckets.anomalies : [],
      all: Array.isArray(payload?.buckets?.all) ? payload.buckets.all : [],
    },
    tagDimensions: payload.tagDimensions || {},
    trendData: Array.isArray(payload.trendData) ? payload.trendData : [],
    topOffenders: Array.isArray(payload.topOffenders) ? payload.topOffenders : [],
  };
}
