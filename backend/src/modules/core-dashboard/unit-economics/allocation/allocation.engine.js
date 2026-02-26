const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const buildAllocationOverview = ({
  totalCloudCost = 0,
  coverage = {},
  sharedPoolAmount = 0,
  allocationMethod = 'direct_spend_weighted',
  allocationConfidence = { score: 0, level: 'low', factors: {} },
}) => {
  const total = toNumber(totalCloudCost);
  const unallocatedPct = toNumber(coverage.unallocatedPct);
  const allocatedPct = total > 0 ? Math.max(0, 100 - unallocatedPct) : 0;

  return {
    totalCloudCost: Number(total.toFixed(2)),
    allocatedPct: Number(allocatedPct.toFixed(2)),
    unallocatedPct: Number(unallocatedPct.toFixed(2)),
    sharedCostPoolAmount: Number(toNumber(sharedPoolAmount).toFixed(2)),
    allocationMethod,
    allocationConfidence,
  };
};

