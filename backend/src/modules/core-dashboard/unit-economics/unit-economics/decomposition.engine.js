const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const byId = (steps = [], id) => {
  if (!Array.isArray(steps)) return 0;
  const match = steps.find((step) => String(step?.id || '').toLowerCase() === String(id).toLowerCase());
  return toNumber(match?.value);
};

export const buildUnitCostDecomposition = ({
  waterfallSteps = [],
  currentVolume = 0,
  startUnitCost = 0,
  endUnitCost = 0,
  sharedAllocationShiftCost = 0,
}) => {
  const denominator = Math.max(1, toNumber(currentVolume));
  const netChange = toNumber(endUnitCost) - toNumber(startUnitCost);

  const infraGrowthCost = byId(waterfallSteps, 'newServicesResources');
  const trafficGrowthCost = byId(waterfallSteps, 'usageGrowth');
  const priceChangeCost = byId(waterfallSteps, 'ratePriceChange');
  const mixShiftCost = byId(waterfallSteps, 'mixShift') - toNumber(sharedAllocationShiftCost);
  const commitmentBenefitCost = byId(waterfallSteps, 'creditsDiscountChange');
  const optimizationSavingsCost = byId(waterfallSteps, 'savingsRemovals');

  const components = [
    { id: 'traffic_growth_effect', label: 'Traffic Growth Effect', value: trafficGrowthCost / denominator },
    { id: 'infra_growth_effect', label: 'Infra Growth Effect', value: infraGrowthCost / denominator },
    { id: 'price_change', label: 'Price Change', value: priceChangeCost / denominator },
    { id: 'mix_shift', label: 'Mix Shift', value: mixShiftCost / denominator },
    { id: 'commitment_benefit', label: 'Commitment Benefit', value: commitmentBenefitCost / denominator },
    { id: 'optimization_savings', label: 'Optimization Savings', value: optimizationSavingsCost / denominator },
    { id: 'shared_allocation_shift', label: 'Shared Allocation Shift', value: toNumber(sharedAllocationShiftCost) / denominator },
  ];

  const subtotal = components.reduce((sum, component) => sum + component.value, 0);
  const correction = netChange - subtotal;
  components.forEach((component) => {
    if (component.id === 'mix_shift') component.value += correction;
  });

  return {
    startUnitCost: Number(toNumber(startUnitCost).toFixed(6)),
    endUnitCost: Number(toNumber(endUnitCost).toFixed(6)),
    components: components.map((component) => ({
      ...component,
      value: Number(component.value.toFixed(6)),
      contributionPct:
        Math.abs(netChange) > 0
          ? Number(((component.value / netChange) * 100).toFixed(2))
          : 0,
    })),
    validationDelta: Number((netChange - components.reduce((sum, component) => sum + component.value, 0)).toFixed(6)),
  };
};

