const SPEND_SERIES_PALETTE = [
  "#23a282",
  "#0ea5e9",
  "#f59e0b",
  "#23a282",
  "#64748b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

export const getSeriesColor = (index: number): string =>
  SPEND_SERIES_PALETTE[index % SPEND_SERIES_PALETTE.length];

export const buildSeriesColorMap = (keys: string[]): Record<string, string> => {
  const map: Record<string, string> = {};
  keys.forEach((key, index) => {
    map[key] = getSeriesColor(index);
  });
  return map;
};

