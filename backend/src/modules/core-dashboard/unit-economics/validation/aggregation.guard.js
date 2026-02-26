const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const guardAggregationIntegrity = ({
  totalCost = 0,
  allocationRows = [],
  epsilon = 0.05,
}) => {
  const rowTotal = allocationRows.reduce((sum, row) => sum + toNumber(row.totalCost), 0);
  const difference = Number((toNumber(totalCost) - rowTotal).toFixed(2));
  return {
    valid: Math.abs(difference) <= epsilon,
    difference,
    totalCost: Number(toNumber(totalCost).toFixed(2)),
    rowTotal: Number(rowTotal.toFixed(2)),
  };
};

