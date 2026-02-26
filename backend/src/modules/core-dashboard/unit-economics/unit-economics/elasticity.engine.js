const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const calculateElasticity = ({ costGrowthPct = 0, volumeGrowthPct = 0 }) => {
  const cost = toNumber(costGrowthPct);
  const volume = toNumber(volumeGrowthPct);

  if (Math.abs(volume) < 0.01) {
    return { score: null, classification: 'undefined' };
  }

  const score = cost / volume;
  const rounded = Number(score.toFixed(4));

  if (rounded < 0) return { score: rounded, classification: 'strong_scale_advantage' };
  if (rounded < 0.95) return { score: rounded, classification: 'efficient_scaling' };
  if (rounded <= 1.05) return { score: rounded, classification: 'linear_scaling' };
  return { score: rounded, classification: 'degrading_scaling' };
};

