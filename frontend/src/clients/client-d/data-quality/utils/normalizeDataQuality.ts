import type { DataQualityEnvelope, DataQualityPayload, DataQualityStats } from "../types";

export const EMPTY_DQ_STATS: DataQualityStats = {
  score: 0,
  totalRows: 0,
  costAtRisk: 0,
  compliance: [],
  buckets: { untagged: [], missingMeta: [], anomalies: [], all: [] },
  tagDimensions: {},
  trendData: [],
  topOffenders: [],
};

export function normalizeDataQualityResponse(res: unknown): DataQualityStats {
  const response = (res as DataQualityEnvelope | DataQualityPayload | null | undefined) ?? null;
  const payload =
    response &&
    typeof response === "object" &&
    "data" in response &&
    response.data &&
    typeof response.data === "object"
      ? response.data
      : response;
  if (!payload) return EMPTY_DQ_STATS;

  const body = payload as DataQualityPayload;
  return {
    score: Number(body.score ?? 0),
    totalRows: Number(body.totalRows ?? 0),
    costAtRisk: Number(body.costAtRisk ?? 0),
    compliance: Array.isArray(body.compliance) ? body.compliance : [],
    buckets: {
      untagged: Array.isArray(body?.buckets?.untagged) ? body.buckets.untagged : [],
      missingMeta: Array.isArray(body?.buckets?.missingMeta) ? body.buckets.missingMeta : [],
      anomalies: Array.isArray(body?.buckets?.anomalies) ? body.buckets.anomalies : [],
      all: Array.isArray(body?.buckets?.all) ? body.buckets.all : [],
    },
    tagDimensions: body.tagDimensions || {},
    trendData: Array.isArray(body.trendData)
      ? body.trendData.map((point) => {
          const score = Number(point?.score ?? 0);
          return point?.date ? { date: point.date, score } : { score };
        })
      : [],
    topOffenders: Array.isArray(body.topOffenders) ? body.topOffenders : [],
  };
}
