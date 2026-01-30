import { unitEconomicsRepository } from "./unit-economics.repository.js";
import { getDateRange } from "../../../common/utils/date.helpers.js";

const n = (v) => Number.parseFloat(v || 0) || 0;

export const unitEconomicsService = {
  async getSummary({ filters = {}, period = null, uploadIds = [] }) {
    const { startDate, endDate } = getDateRange(period);

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
      const cost = n(r.effectivecost ?? r.billedcost);
      const qty = n(r.consumedquantity);

      if (!daily.has(date)) {
        daily.set(date, { date, cost: 0, quantity: 0 });
      }
      daily.get(date).cost += cost;
      daily.get(date).quantity += qty;
    }

    const trend = Array.from(daily.values()).map(d => ({
      date: d.date,
      cost: Number(d.cost.toFixed(2)),
      quantity: Number(d.quantity.toFixed(2)),
      unitPrice: d.quantity > 0 ? Number((d.cost / d.quantity).toFixed(6)) : 0
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

    const changePct =
      baseUnit > 0 ? ((currUnit - baseUnit) / baseUnit) * 100 : 0;

    return {
      kpis: {
        totalCost: Number(totalCost.toFixed(2)),
        totalQuantity: Number(totalQuantity.toFixed(2)),
        avgUnitPrice: Number(avgUnitPrice.toFixed(6)),
        unitPriceChangePct: Number(changePct.toFixed(2)),
        driftDetected: Math.abs(changePct) > 15
      },
      trend,
      drift: {
        baselineUnitPrice: Number(baseUnit.toFixed(6)),
        currentUnitPrice: Number(currUnit.toFixed(6)),
        changePct: Number(changePct.toFixed(2)),
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
