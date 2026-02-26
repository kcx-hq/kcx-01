const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const stdDev = (values = []) => {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length - 1);
  return Math.sqrt(variance);
};

export const analyzeVolatility = (series = []) => {
  const values = series.map((item) => toNumber(item)).filter((value) => value > 0);
  if (!values.length) return { scorePct: 0, level: 'low' };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (!mean) return { scorePct: 0, level: 'low' };
  const cv = stdDev(values) / mean;
  const scorePct = Number((cv * 100).toFixed(2));
  const level = scorePct >= 35 ? 'high' : scorePct >= 20 ? 'medium' : 'low';
  return { scorePct, level };
};

