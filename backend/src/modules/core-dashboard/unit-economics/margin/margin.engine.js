const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const buildMarginOverlay = ({
  revenue = 0,
  finalAllocatedCost = 0,
  volume = 0,
  previousRevenue = 0,
  previousCost = 0,
  previousVolume = 0,
}) => {
  const currRevenue = toNumber(revenue);
  const currCost = toNumber(finalAllocatedCost);
  const currVolume = toNumber(volume);
  const prevRevenue = toNumber(previousRevenue);
  const prevCost = toNumber(previousCost);
  const prevVolume = toNumber(previousVolume);

  if (currRevenue <= 0 || currVolume <= 0) {
    return {
      available: false,
      revenuePerUnit: null,
      costPerUnit: null,
      marginPerUnit: null,
      marginTrendPct: null,
    };
  }

  const revenuePerUnit = currRevenue / currVolume;
  const costPerUnit = currCost / currVolume;
  const marginPerUnit = revenuePerUnit - costPerUnit;

  let marginTrendPct = null;
  if (prevRevenue > 0 && prevVolume > 0) {
    const prevMarginPerUnit = prevRevenue / prevVolume - prevCost / prevVolume;
    if (prevMarginPerUnit !== 0) {
      marginTrendPct = ((marginPerUnit - prevMarginPerUnit) / Math.abs(prevMarginPerUnit)) * 100;
    }
  }

  return {
    available: true,
    revenuePerUnit: Number(revenuePerUnit.toFixed(6)),
    costPerUnit: Number(costPerUnit.toFixed(6)),
    marginPerUnit: Number(marginPerUnit.toFixed(6)),
    marginTrendPct: marginTrendPct === null ? null : Number(marginTrendPct.toFixed(2)),
  };
};

