import { unitEconomicsService } from "../../../core-dashboard/unit-economics/unit-economics.service.js";
import {BillingUsageFact} from "../../../../models/index.js";

const n = (v) => Number.parseFloat(v || 0) || 0;

export const clientDUnitEconomicsService = {
  async getSummary(params = {}) {
    /** 1️⃣ Core summary */
    const core = await unitEconomicsService.getSummary(params);

    /** 2️⃣ SKU breakdown */
    const rows = await BillingUsageFact.findAll({
      where: { uploadid: params.uploadIds },
      attributes: [
        "skuid",
        "consumedquantity",
        "effectivecost",
        "listunitprice",
        "contractedunitprice",
        "commitmentdiscountid"
      ],
      raw: true
    });

    const bySku = new Map();

    for (const r of rows) {
      const sku = r.skuid || "Unknown SKU";
      const cost = n(r.effectivecost);
      const qty = n(r.consumedquantity);

      if (!bySku.has(sku)) {
        bySku.set(sku, {
          sku,
          cost: 0,
          quantity: 0,
          listUnitPrice: n(r.listunitprice),
          contractedUnitPrice: n(r.contractedunitprice),
          committed: !!r.commitmentdiscountid
        });
      }

      const s = bySku.get(sku);
      s.cost += cost;
      s.quantity += qty;
    }

    const skuEfficiency = Array.from(bySku.values())
      .map(s => ({
        ...s,
        effectiveUnitPrice:
          s.quantity > 0 ? Number((s.cost / s.quantity).toFixed(6)) : 0,
        savingsVsList:
          s.listUnitPrice > 0
            ? Number(
                ((s.listUnitPrice - s.effectiveUnitPrice) /
                  s.listUnitPrice) *
                  100
              ).toFixed(2)
            : 0
      }))
      .sort((a, b) => b.cost - a.cost);

    return {
      ...core,
      skuEfficiency
    };
  }
};
