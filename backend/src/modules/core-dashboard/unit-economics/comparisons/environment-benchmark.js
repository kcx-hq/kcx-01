const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const unit = (cost, quantity) => (quantity > 0 ? cost / quantity : 0);

export const buildEnvironmentBenchmark = ({ currentRows = [], previousRows = [] }) => {
  const previousMap = new Map();
  previousRows.forEach((row) => {
    previousMap.set(row.environment, row);
  });

  return currentRows
    .map((row) => {
      const prev = previousMap.get(row.environment);
      const currentUnitCost = unit(toNumber(row.finalCost), toNumber(row.quantity));
      const previousUnitCost = prev ? unit(toNumber(prev.finalCost), toNumber(prev.quantity)) : 0;
      const deltaPct =
        previousUnitCost > 0 ? ((currentUnitCost - previousUnitCost) / previousUnitCost) * 100 : 0;

      return {
        environment: row.environment,
        volume: Number(toNumber(row.quantity).toFixed(2)),
        finalCost: Number(toNumber(row.finalCost).toFixed(2)),
        unitCost: Number(currentUnitCost.toFixed(6)),
        deltaPct: Number(deltaPct.toFixed(2)),
      };
    })
    .sort((a, b) => b.finalCost - a.finalCost);
};

