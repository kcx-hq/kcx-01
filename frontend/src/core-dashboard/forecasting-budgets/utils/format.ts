export const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCurrency = (value: unknown, currency = "USD"): string => {
  const amount = toNumber(value);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};

export const formatPercent = (value: unknown, digits = 2): string =>
  `${toNumber(value).toFixed(digits)}%`;

export const formatSignedPercent = (value: unknown, digits = 2): string => {
  const n = toNumber(value);
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
};

export const formatSignedCurrency = (value: unknown, currency = "USD"): string => {
  const n = toNumber(value);
  const f = formatCurrency(Math.abs(n), currency);
  return `${n >= 0 ? "+" : "-"}${f}`;
};

export const formatNullableNumber = (value: number | null, digits = 2): string =>
  value == null ? "N/A" : toNumber(value).toFixed(digits);

