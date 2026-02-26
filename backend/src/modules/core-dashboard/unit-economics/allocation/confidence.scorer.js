const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const levelFromScore = (score) => {
  if (score >= 85) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
};

export const scoreAllocationConfidence = ({
  tagCoveragePct = 0,
  sharedPoolRatioPct = 0,
  ruleCompletenessPct = 100,
  dataConsistencyPct = 100,
}) => {
  const sharedRatioRiskScore = clamp(100 - sharedPoolRatioPct, 0, 100);
  const score =
    0.35 * clamp(tagCoveragePct, 0, 100) +
    0.25 * sharedRatioRiskScore +
    0.2 * clamp(ruleCompletenessPct, 0, 100) +
    0.2 * clamp(dataConsistencyPct, 0, 100);

  const normalized = Number(score.toFixed(2));
  return {
    score: normalized,
    level: levelFromScore(normalized),
    factors: {
      tagCoveragePct: Number(clamp(tagCoveragePct, 0, 100).toFixed(2)),
      sharedPoolRatioPct: Number(clamp(sharedPoolRatioPct, 0, 100).toFixed(2)),
      ruleCompletenessPct: Number(clamp(ruleCompletenessPct, 0, 100).toFixed(2)),
      dataConsistencyPct: Number(clamp(dataConsistencyPct, 0, 100).toFixed(2)),
    },
  };
};

