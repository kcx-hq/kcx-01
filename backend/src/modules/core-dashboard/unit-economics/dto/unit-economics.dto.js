export const toUnitEconomicsDto = ({
  kpis = {},
  trend = [],
  previousTrend = [],
  decomposition = {},
  benchmarks = {},
  margin = {},
  forecast = {},
  breakEven = {},
}) => ({
  kpis,
  trend,
  previousTrend,
  decomposition,
  benchmarks,
  margin,
  forecast,
  breakEven,
});

