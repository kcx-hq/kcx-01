export const formatCurrency = (value: number) => {
  const amount = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(amount);
  const tiny = abs > 0 && abs < 0.01;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: tiny ? 6 : 2,
    minimumFractionDigits: tiny ? 4 : 2,
  }).format(amount);
};

export const formatNumber = (value: number, digits = 2) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

export const formatPercent = (value: number | null, digits = 2) => {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  return `${formatNumber(value, digits)}%`;
};

export const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
