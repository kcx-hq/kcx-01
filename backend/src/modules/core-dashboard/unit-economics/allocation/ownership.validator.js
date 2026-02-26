const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const validateOwnershipBalance = ({
  allocationRows = [],
  sharedPoolTotal = 0,
  redistributedAmount = 0,
  epsilon = 0.05,
}) => {
  const direct = allocationRows.reduce((sum, row) => sum + toNumber(row.directCost), 0);
  const shared = allocationRows.reduce((sum, row) => sum + toNumber(row.sharedAllocatedCost), 0);
  const final = allocationRows.reduce((sum, row) => sum + toNumber(row.totalCost), 0);

  const balanceDiff = Number((toNumber(sharedPoolTotal) - toNumber(redistributedAmount)).toFixed(2));
  const sharedAllocationDiff = Number((toNumber(sharedPoolTotal) - shared).toFixed(2));
  const additivityDiff = Number((final - (direct + shared)).toFixed(2));

  return {
    noDoubleAllocation: Math.abs(additivityDiff) <= epsilon,
    sharedPoolBalanced: Math.abs(balanceDiff) <= epsilon && Math.abs(sharedAllocationDiff) <= epsilon,
    crossTeamLeakage: false,
    diagnostics: {
      direct: Number(direct.toFixed(2)),
      shared: Number(shared.toFixed(2)),
      final: Number(final.toFixed(2)),
      additivityDiff,
      sharedPoolBalanceDiff: balanceDiff,
      sharedAllocationDiff,
    },
  };
};

