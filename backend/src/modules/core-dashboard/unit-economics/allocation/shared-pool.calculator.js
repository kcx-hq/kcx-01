const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeText = (value, fallback) => {
  const text = String(value || '').trim();
  return text || fallback;
};

export const summarizeSharedPoolByCategory = ({
  sharedRows = [],
  allocationMethod = 'direct_spend_weighted',
  weightBasis = 'direct_cost',
}) => {
  const categories = new Map();

  sharedRows.forEach((row) => {
    const category = normalizeText(row.chargeCategory, 'Shared - Uncategorized');
    const current = categories.get(category) || {
      sharedCategory: category,
      cost: 0,
      allocationRule: allocationMethod,
      weightBasis,
      distributedAmount: 0,
      rowCount: 0,
    };
    current.cost += toNumber(row.cost);
    current.rowCount += 1;
    categories.set(category, current);
  });

  const rows = Array.from(categories.values())
    .map((row) => ({
      ...row,
      cost: Number(row.cost.toFixed(2)),
      distributedAmount: Number(row.cost.toFixed(2)),
    }))
    .sort((a, b) => b.cost - a.cost);

  const sharedPoolTotal = rows.reduce((sum, row) => sum + toNumber(row.cost), 0);
  const distributedTotal = rows.reduce((sum, row) => sum + toNumber(row.distributedAmount), 0);
  const balanceDiff = Number((sharedPoolTotal - distributedTotal).toFixed(2));

  return {
    rows,
    validation: {
      sharedPoolTotal: Number(sharedPoolTotal.toFixed(2)),
      distributedTotal: Number(distributedTotal.toFixed(2)),
      balanceDiff,
      isBalanced: Math.abs(balanceDiff) <= 0.05,
    },
  };
};

