import type { NumericLike } from "../types";

export const formatCurrency = (value: NumericLike | null | undefined): string => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(amount);
};

export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatPercent = (value: NumericLike | null | undefined): string => {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
};
