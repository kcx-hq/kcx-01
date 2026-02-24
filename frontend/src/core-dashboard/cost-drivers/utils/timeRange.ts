export const getPeriodFromTimeRange = (timeRange: string): number => {
  const source = String(timeRange || '30d').trim().toLowerCase();
  const match = source.match(/^(\d+)d$/);
  if (match) {
    const value = Number(match[1]);
    return Number.isFinite(value) && value > 0 ? value : 30;
  }
  if (source === 'mtd') return 30;
  if (source === 'qtd') return 90;
  return 30;
};
