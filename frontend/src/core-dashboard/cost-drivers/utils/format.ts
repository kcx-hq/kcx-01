export const formatCurrency = (val: number | null | undefined) => {
  if (val === undefined || val === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(val);
};

export const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};



