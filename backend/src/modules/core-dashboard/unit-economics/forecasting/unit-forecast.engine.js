const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const forecastUnitEconomics = ({ trend = [], horizonDays = 30, volatilityPct = 0 }) => {
  if (!Array.isArray(trend) || !trend.length) {
    return {
      projectedCost: 0,
      projectedVolume: 0,
      projectedUnitCost: 0,
      lowerUnitCost: 0,
      upperUnitCost: 0,
      method: 'moving_average',
      confidence: 'low',
      assumptions: ['No trend points available'],
    };
  }

  const sample = trend.slice(-Math.min(7, trend.length));
  const avgCost = sample.reduce((sum, row) => sum + toNumber(row.cost), 0) / sample.length;
  const avgVolume = sample.reduce((sum, row) => sum + toNumber(row.quantity), 0) / sample.length;
  const projectedCost = avgCost * horizonDays;
  const projectedVolume = avgVolume * horizonDays;
  const projectedUnitCost = projectedVolume > 0 ? projectedCost / projectedVolume : 0;

  const bandPct = clamp(toNumber(volatilityPct) / 100, 0.08, 0.35);
  const lowerUnitCost = projectedUnitCost * (1 - bandPct);
  const upperUnitCost = projectedUnitCost * (1 + bandPct);

  const confidence =
    bandPct <= 0.12 ? 'high' : bandPct <= 0.25 ? 'medium' : 'low';

  return {
    projectedCost: Number(projectedCost.toFixed(2)),
    projectedVolume: Number(projectedVolume.toFixed(2)),
    projectedUnitCost: Number(projectedUnitCost.toFixed(6)),
    lowerUnitCost: Number(lowerUnitCost.toFixed(6)),
    upperUnitCost: Number(upperUnitCost.toFixed(6)),
    method: 'moving_average',
    confidence,
    assumptions: [
      `Horizon: ${horizonDays} days`,
      'Projection based on recent daily average',
      'Confidence band derived from historical volatility',
    ],
  };
};

