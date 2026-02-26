const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const calculateUnitCost = ({ finalAllocatedCost = 0, volume = 0 }) => {
  const cost = toNumber(finalAllocatedCost);
  const qty = toNumber(volume);
  if (qty <= 0) return 0;
  return Number((cost / qty).toFixed(6));
};

export const calculateUnitCostChangePct = ({ currentUnitCost = 0, previousUnitCost = 0 }) => {
  const curr = toNumber(currentUnitCost);
  const prev = toNumber(previousUnitCost);
  if (!prev) return curr > 0 ? 100 : 0;
  return Number((((curr - prev) / prev) * 100).toFixed(2));
};

