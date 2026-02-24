import { unitEconomicsRepository } from "./unit-economics.repository.js";
import { getDateRange } from "../../../common/utils/date.helpers.js";
import {
  costGrowthRate,
  roundTo,
} from "../../../common/utils/cost.calculations.js";

const n = (v) => Number.parseFloat(v || 0) || 0;
const sanitizeBasis = (value) => {
  const basis = String(value || "actual").toLowerCase();
  if (basis === "amortized" || basis === "net" || basis === "actual") return basis;
  return "actual";
};

const rowCostByBasis = (row, basis) => {
  const billed = n(row.billedcost);
  const effective = n(row.effectivecost);
  const contracted = n(row.contractedcost);

  if (basis === "amortized") return effective || billed;
  if (basis === "net") return contracted || effective || billed;
  return billed || effective;
};

export const unitEconomicsService = {
  async getSummary({ filters = {}, period = null, costBasis = "actual", uploadIds = [] }) {
    const { startDate, endDate } = getDateRange(period);
    const safeBasis = sanitizeBasis(costBasis);

    const rows = await unitEconomicsRepository.getFacts({
      filters,
      startDate,
      endDate,
      uploadIds
    });

    if (!rows.length) {
      return {
        kpis: {
          totalCost: 0,
          totalQuantity: 0,
          avgUnitPrice: 0,
          unitPriceChangePct: 0,
          driftDetected: false
        },
        trend: [],
        drift: null
      };
    }

    /** ---- Daily aggregation ---- */
    const daily = new Map();

    for (const r of rows) {
      const date = String(r.chargeperiodstart).split("T")[0];
      const cost = rowCostByBasis(r, safeBasis);
      const qty = n(r.consumedquantity);

      if (!daily.has(date)) {
        daily.set(date, { date, cost: 0, quantity: 0 });
      }
      daily.get(date).cost += cost;
      daily.get(date).quantity += qty;
    }

    const trend = Array.from(daily.values()).map(d => ({
      date: d.date,
      cost: roundTo(d.cost, 2),
      quantity: roundTo(d.quantity, 2),
      unitPrice: d.quantity > 0 ? roundTo(d.cost / d.quantity, 6) : 0
    }));

    /** ---- KPIs ---- */
    const totalCost = trend.reduce((s, r) => s + r.cost, 0);
    const totalQuantity = trend.reduce((s, r) => s + r.quantity, 0);
    const avgUnitPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    /** ---- Drift detection (first 70% vs last 30%) ---- */
    const split = Math.floor(trend.length * 0.7) || 1;
    const base = trend.slice(0, split);
    const curr = trend.slice(split);

    const baseUnit =
      base.reduce((s, r) => s + r.cost, 0) /
      (base.reduce((s, r) => s + r.quantity, 0) || 1);

    const currUnit =
      curr.reduce((s, r) => s + r.cost, 0) /
      (curr.reduce((s, r) => s + r.quantity, 0) || 1);

    const changePct = costGrowthRate(currUnit, baseUnit);

    return {
      kpis: {
        totalCost: roundTo(totalCost, 2),
        totalQuantity: roundTo(totalQuantity, 2),
        avgUnitPrice: roundTo(avgUnitPrice, 6),
        unitPriceChangePct: roundTo(changePct, 2),
        driftDetected: Math.abs(changePct) > 15,
        costBasis: safeBasis,
      },
      trend,
      drift: {
        baselineUnitPrice: roundTo(baseUnit, 6),
        currentUnitPrice: roundTo(currUnit, 6),
        changePct: roundTo(changePct, 2),
        thresholdPct: 15,
        status:
          Math.abs(changePct) > 30
            ? "critical"
            : Math.abs(changePct) > 15
            ? "warning"
            : "stable"
      }
    };
  }
};
