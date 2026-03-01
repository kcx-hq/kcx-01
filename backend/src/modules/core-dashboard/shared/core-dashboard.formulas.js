import { roundTo } from "../../../common/utils/cost.calculations.js";

export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const clamp = (value, min, max) =>
  Math.max(toNumber(min, 0), Math.min(toNumber(max, 0), toNumber(value, 0)));

export const safeDivide = (numerator, denominator, fallback = 0) => {
  const den = toNumber(denominator, 0);
  if (den === 0) return toNumber(fallback, 0);
  return toNumber(numerator, 0) / den;
};

export const percent = (part, total, decimals = null) => {
  const value = safeDivide(toNumber(part, 0) * 100, total, 0);
  return Number.isInteger(decimals) ? roundTo(value, decimals) : value;
};

export const delta = (currentValue, previousValue, decimals = null) => {
  const value = toNumber(currentValue, 0) - toNumber(previousValue, 0);
  return Number.isInteger(decimals) ? roundTo(value, decimals) : value;
};

export const growthPct = (currentValue, previousValue, decimals = null) => {
  const value = safeDivide(
    delta(currentValue, previousValue, null) * 100,
    previousValue,
    0,
  );
  return Number.isInteger(decimals) ? roundTo(value, decimals) : value;
};

export const budgetVarianceValue = (forecastValue, budgetValue, decimals = 2) =>
  roundTo(delta(forecastValue, budgetValue, null), decimals);

export const budgetConsumptionPct = (actualSpend, budgetValue, decimals = 2) =>
  roundTo(percent(actualSpend, budgetValue, null), decimals);

export const burnRatePerDay = (spendValue, elapsedDays, decimals = 2) =>
  roundTo(safeDivide(spendValue, elapsedDays, 0), decimals);

export const runRateForecast = (
  currentSpend,
  elapsedDays,
  totalDays,
  decimals = 2,
) => roundTo(safeDivide(currentSpend, elapsedDays, 0) * toNumber(totalDays, 0), decimals);

export const breachEtaDays = (
  budgetValue,
  currentSpend,
  currentBurnRate,
  decimals = 2,
) => {
  const burn = toNumber(currentBurnRate, 0);
  if (burn <= 0) return null;
  return roundTo(safeDivide(toNumber(budgetValue, 0) - toNumber(currentSpend, 0), burn, 0), decimals);
};

export const requiredDailySpend = (
  budgetValue,
  currentSpend,
  remainingDays,
  decimals = 2,
) => {
  if (toNumber(remainingDays, 0) <= 0) return 0;
  return roundTo(
    safeDivide(toNumber(budgetValue, 0) - toNumber(currentSpend, 0), remainingDays, 0),
    decimals,
  );
};

export const confidenceLevelFromScore = (
  score,
  { high = 85, medium = 70 } = {},
) => {
  const normalized = toNumber(score, 0);
  if (normalized >= high) return "high";
  if (normalized >= medium) return "medium";
  return "low";
};

export const scoreBandStatus = (
  score,
  { pass = 90, warn = 75 } = {},
) => {
  const normalized = toNumber(score, 0);
  if (normalized >= pass) return "pass";
  if (normalized >= warn) return "warn";
  return "fail";
};

export const average = (values = [], decimals = null) => {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const numeric = values.map((v) => toNumber(v, 0));
  const value =
    numeric.reduce((sum, item) => sum + item, 0) / Math.max(1, numeric.length);
  return Number.isInteger(decimals) ? roundTo(value, decimals) : value;
};

export const computeForecastErrorStats = (
  trend = [],
  { lookback = 7, valueSelector = (row) => row?.cost } = {},
) => {
  if (!Array.isArray(trend) || trend.length <= lookback) {
    return { mapePct: null, biasPct: null, accuracyScore: null, errors: [] };
  }

  const errors = [];
  for (let index = lookback; index < trend.length; index += 1) {
    const actual = toNumber(valueSelector(trend[index]), 0);
    if (actual <= 0) continue;

    const history = trend.slice(index - lookback, index).map((row) => toNumber(valueSelector(row), 0));
    const forecast = average(history, null);
    const absErrorPct = safeDivide(Math.abs(actual - forecast) * 100, actual, 0);
    const biasPct = safeDivide((forecast - actual) * 100, actual, 0);

    errors.push({
      index,
      actual: roundTo(actual, 2),
      forecast: roundTo(forecast, 2),
      absErrorPct: roundTo(absErrorPct, 2),
      biasPct: roundTo(biasPct, 2),
      date: trend[index]?.date || null,
    });
  }

  if (!errors.length) {
    return { mapePct: null, biasPct: null, accuracyScore: null, errors: [] };
  }

  const mapePct = roundTo(average(errors.map((item) => item.absErrorPct), null), 2);
  const biasPct = roundTo(average(errors.map((item) => item.biasPct), null), 2);
  const accuracyScore = roundTo(clamp(100 - mapePct, 0, 100), 2);

  return { mapePct, biasPct, accuracyScore, errors };
};
