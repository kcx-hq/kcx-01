const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const classifyEfficiency = ({
  unitCostChangePct = 0,
  costGrowthPct = 0,
  volumeGrowthPct = 0,
  volatilityLevel = 'low',
  elasticityClassification = 'undefined',
}) => {
  const unitDelta = toNumber(unitCostChangePct);
  const costGrowth = toNumber(costGrowthPct);
  const volumeGrowth = toNumber(volumeGrowthPct);

  let status = 'stable';
  if (volatilityLevel === 'high') status = 'volatile_behavior';
  else if (unitDelta <= -2) status = 'efficient_scaling';
  else if (unitDelta >= 2) status = 'degrading_efficiency';
  else status = 'linear_scaling';

  const riskFlags = [];
  if (volatilityLevel === 'high') riskFlags.push('high_volatility');
  if (costGrowth > volumeGrowth + 3) riskFlags.push('infra_growth_outpacing_volume');
  if (elasticityClassification === 'degrading_scaling') riskFlags.push('elasticity_degrading');
  if (elasticityClassification === 'undefined') riskFlags.push('elasticity_low_signal');

  return {
    status,
    rootCause:
      status === 'degrading_efficiency'
        ? 'Cost growth is outpacing volume growth in current window.'
        : status === 'efficient_scaling'
          ? 'Volume growth is absorbing cost growth, lowering unit cost.'
          : status === 'volatile_behavior'
            ? 'High volatility is weakening pricing and margin predictability.'
            : 'Cost and volume are scaling in a controlled linear band.',
    confidenceLevel:
      volatilityLevel === 'low'
        ? 'high'
        : volatilityLevel === 'medium'
          ? 'medium'
          : 'low',
    riskFlags,
  };
};

